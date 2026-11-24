import "server-only";

const UNKNOWN_IP = "unknown";

/** The visitor's IP address as the host's proxy reports it. Used only for rate limits and the audit log. */
export function getClientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || UNKNOWN_IP;
}
