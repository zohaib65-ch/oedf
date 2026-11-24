import { getAuth } from "@/server/auth/auth";

// Sign-in, sign-out, password reset and sessions are handled by Better Auth under /api/auth/*.
async function handleAuthRequest(request: Request): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export { handleAuthRequest as GET, handleAuthRequest as POST };
