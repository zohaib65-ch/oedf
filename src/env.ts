import { z } from "zod";

// Only three variables are always required (site URL, database, auth secret). Everything else is
// optional locally and required only on a real deployment, which is any build whose site URL is
// not localhost. Locally, mail goes to Mailpit, and uploads and the spam check report that they
// are not configured. See docs/setup-and-deployment.md.

// Mailpit, the test inbox that `docker compose up -d` starts (http://localhost:8025).
const DEV_SMTP_URL = "smtp://localhost:1025";
const DEV_EMAIL_FROM = "OEDF <no-reply@localhost>";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const MIN_SECRET_LENGTH = 32;

/** A variable left empty in `.env.local` counts as not set. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional(z.string()),
});

const serverEnvSchema = publicEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, "Must be a MongoDB connection string"),
  BETTER_AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH, "Must be at least 32 characters"),
  // Cloudinary's "API environment variable": cloudinary://<api key>:<api secret>@<cloud name>.
  CLOUDINARY_URL: optional(
    z
      .string()
      .regex(
        /^cloudinary:\/\/[^:@/]+:[^:@/]+@[^:@/]+$/,
        "Must look like cloudinary://key:secret@cloud",
      ),
  ),
  SMTP_URL: optional(z.string().regex(/^smtps?:\/\//, "Must start with smtp:// or smtps://")),
  EMAIL_FROM: optional(z.string()),
  TURNSTILE_SECRET_KEY: optional(z.string()),
  CRON_SECRET: optional(z.string().min(MIN_SECRET_LENGTH, "Must be at least 32 characters")),
});

type RawServerEnv = z.infer<typeof serverEnvSchema>;

/** The variables a real deployment must set instead of relying on a development default. */
const DEPLOYMENT_ONLY = [
  "CLOUDINARY_URL",
  "SMTP_URL",
  "EMAIL_FROM",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "CRON_SECRET",
] as const satisfies readonly (keyof RawServerEnv)[];

function isLocalSite(siteUrl: string): boolean {
  return LOCAL_HOSTNAMES.has(new URL(siteUrl).hostname);
}

/** Turns a Zod failure into a message that names the variables but never prints their values. */
function describeInvalidEnv(issues: readonly { path: PropertyKey[]; message: string }[]): string {
  const lines = issues.map((issue) => `  - ${issue.path.map(String).join(".")}: ${issue.message}`);
  return `Invalid environment variables:\n${lines.join("\n")}\nSee docs/setup-and-deployment.md.`;
}

function parseEnv<T extends z.ZodType>(schema: T, source: unknown): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(describeInvalidEnv(result.error.issues));
  }
  return result.data;
}

/** Variables that are safe to ship to the browser. Next.js inlines each literal reference. */
export const publicEnv = (() => {
  const env = parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
  return env;
})();

function resolveServerEnv(source: unknown) {
  const env = parseEnv(serverEnvSchema, source);
  if (!isLocalSite(env.NEXT_PUBLIC_SITE_URL)) {
    const missing = DEPLOYMENT_ONLY.filter((name) => env[name] === undefined);
    if (missing.length > 0) {
      throw new Error(
        describeInvalidEnv(
          missing.map((name) => ({
            path: [name],
            message: "Required when the site URL is not localhost",
          })),
        ),
      );
    }
  }
  return {
    ...env,
    SMTP_URL: env.SMTP_URL ?? DEV_SMTP_URL,
    EMAIL_FROM: env.EMAIL_FROM ?? DEV_EMAIL_FROM,
    /** Undefined in development: uploads report that Cloudinary is not configured. */
    CLOUDINARY_URL: env.CLOUDINARY_URL,
    /** Undefined in development: the cleanup endpoint then refuses every call. */
    CRON_SECRET: env.CRON_SECRET,
  };
}

type ServerEnv = ReturnType<typeof resolveServerEnv>;

let cachedServerEnv: ServerEnv | undefined;

/** Validated server variables. Throws when called in the browser or when a variable is missing. */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server environment variables are not available in the browser.");
  }
  cachedServerEnv ??= resolveServerEnv(process.env);
  return cachedServerEnv;
}
