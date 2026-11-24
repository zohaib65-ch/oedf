import "server-only";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";
import { z } from "zod";

import { getServerEnv } from "@/env";
import type { ROLES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { sendEmail } from "@/server/email/send-email";
import { PasswordLinkEmail } from "@/server/email/templates/password-link-email";
import { createAuditEntry } from "@/server/repositories/audit-log.repository";
import { getClientIp } from "@/server/security/client-ip";

// The four staff roles from src/lib/constants/enums.ts. Only Super Admin gets the plugin's admin rights.
const accessControl = createAccessControl(defaultStatements);
const STAFF_ROLES = {
  SUPER_ADMIN: accessControl.newRole(adminAc.statements),
  CEO_OFFICE: accessControl.newRole(userAc.statements),
  DIRECTOR: accessControl.newRole(userAc.statements),
  STAFF: accessControl.newRole(userAc.statements),
} satisfies Record<(typeof ROLES)[number], unknown>;

const MIN_PASSWORD_LENGTH = 12;
const SECONDS_PER_MINUTE = 60;
const SIGN_IN_ATTEMPTS_PER_MINUTE = 5;
const PASSWORD_REQUESTS_PER_MINUTE = 3;
// One lifetime for invitations and resets: an invited person may not open the email at once.
const PASSWORD_LINK_LIFETIME_SECONDS = 24 * 60 * 60;
const INVITED_MARKER = encodeURIComponent("invited=1");
// Account actions a person takes themselves. They are written to the audit log after they succeed.
const AUDITED_ACCOUNT_PATHS: Record<string, string> = {
  "/sign-in/email": "auth.signed-in",
  "/change-password": "auth.password-changed",
  "/update-user": "auth.profile-updated",
  "/revoke-session": "auth.session-revoked",
  "/revoke-other-sessions": "auth.session-revoked",
};
const ADMIN_CREATE_USER_PATH = "/admin/create-user";

const adminCreateUserBodySchema = z.object({ password: z.string().optional() });

// Better Auth's admin createUser checks only the maximum password length, so the minimum is enforced here.
// eslint-disable-next-line @typescript-eslint/require-await -- Better Auth requires an async middleware.
const enforceMinimumPasswordOnCreateUser = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== ADMIN_CREATE_USER_PATH) {
    return;
  }
  const { password } = adminCreateUserBodySchema.parse(ctx.body);
  if (password !== undefined && password.length < MIN_PASSWORD_LENGTH) {
    throw new APIError("BAD_REQUEST", {
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }
});

const auditAccountActions = createAuthMiddleware(async (ctx) => {
  const action = AUDITED_ACCOUNT_PATHS[ctx.path];
  const user = ctx.context.newSession?.user ?? ctx.context.session?.user;
  if (!action || !user) {
    return;
  }
  const requestHeaders = ctx.request?.headers;
  await createAuditEntry({
    actorId: user.id,
    actorName: user.name,
    action,
    entityType: "User",
    entityId: user.id,
    ipAddress: requestHeaders ? getClientIp({ headers: requestHeaders }) : "",
    userAgent: requestHeaders?.get("user-agent") ?? "",
  });
});

async function createAuth() {
  const env = getServerEnv();
  const { connection } = await connectDb();
  const client = connection.getClient();
  const isProduction = env.NODE_ENV === "production";

  return betterAuth({
    baseURL: env.NEXT_PUBLIC_SITE_URL,
    secret: env.BETTER_AUTH_SECRET,
    // Reusing the Mongoose client lets the adapter run its writes in transactions.
    database: mongodbAdapter(client.db(connection.name), { client }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      resetPasswordTokenExpiresIn: PASSWORD_LINK_LIFETIME_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: url.includes(INVITED_MARKER)
            ? "You have been invited to the OEDF staff portal"
            : "Reset your OEDF staff portal password",
          template: PasswordLinkEmail({
            name: user.name,
            link: url,
            kind: url.includes(INVITED_MARKER) ? "INVITATION" : "RESET",
          }),
        });
      },
      onPasswordReset: async ({ user }) => {
        await createAuditEntry({
          actorId: user.id,
          actorName: user.name,
          action: "auth.password-reset",
          entityType: "User",
          entityId: user.id,
          ipAddress: "",
          userAgent: "",
        });
      },
    },
    user: {
      additionalFields: {
        departmentId: { type: "string", required: false, input: false },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: SECONDS_PER_MINUTE, max: SIGN_IN_ATTEMPTS_PER_MINUTE },
        "/request-password-reset": {
          window: SECONDS_PER_MINUTE,
          max: PASSWORD_REQUESTS_PER_MINUTE,
        },
      },
    },
    advanced: {
      useSecureCookies: isProduction,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: isProduction },
    },
    hooks: { before: enforceMinimumPasswordOnCreateUser, after: auditAccountActions },
    // Staff accounts are created, deactivated (banned) and reset by Super Admin only. Everything
    // else (who may review or publish what) is decided by the permission map, not by this plugin.
    plugins: [
      admin({
        ac: accessControl,
        roles: STAFF_ROLES,
        defaultRole: "STAFF",
        adminRoles: ["SUPER_ADMIN"],
      }),
    ],
  });
}

let authPromise: ReturnType<typeof createAuth> | undefined;

/** The one Better Auth instance, created on first use. */
export function getAuth(): ReturnType<typeof createAuth> {
  authPromise ??= createAuth().catch((error: unknown) => {
    authPromise = undefined;
    throw error;
  });
  return authPromise;
}
