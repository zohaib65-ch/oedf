import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const serverEnvSchema = publicEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, "Must be a MongoDB connection string"),
  BETTER_AUTH_SECRET: z.string().min(32, "Must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(12, "Must be at least 12 characters"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Turns a Zod failure into a message that names the variables but never prints their values. */
function describeInvalidEnv(error: z.ZodError): string {
  const lines = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
  return `Invalid environment variables:\n${lines.join("\n")}\nSee docs/setup-and-deployment.md.`;
}

function parseEnv<T extends z.ZodType>(schema: T, source: unknown): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(describeInvalidEnv(result.error));
  }
  return result.data;
}

/** Variables that are safe to ship to the browser. Next.js inlines each literal reference. */
export const publicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

let cachedServerEnv: ServerEnv | undefined;

/** Validated server variables. Throws when called in the browser or when a variable is missing. */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server environment variables are not available in the browser.");
  }
  cachedServerEnv ??= parseEnv(serverEnvSchema, process.env);
  return cachedServerEnv;
}

/** Variables used only by `npm run db:seed`. */
export function getSeedEnv(): z.infer<typeof seedEnvSchema> {
  return parseEnv(seedEnvSchema, process.env);
}
