// The security headers on every response, set in `next.config.ts`. The only outside sources the
// pages may use are Cloudflare Turnstile (the spam check) and Cloudinary (uploads and images).
//
// The Content-Security-Policy has no nonce: Cache Components prerender a static shell that cannot
// carry a per-request nonce, so inline scripts are allowed by `'unsafe-inline'` (Next.js's own
// boot scripts and the JSON-LD blocks), as the Next.js guide describes for this setup.

const TURNSTILE = "https://challenges.cloudflare.com";
const CLOUDINARY_UPLOAD = "https://api.cloudinary.com";
const CLOUDINARY_IMAGES = "https://res.cloudinary.com";
const TWO_YEARS_SECONDS = 63_072_000;

interface SecurityHeaderOptions {
  isDev: boolean;
  /** The site is served over https (production and previews), so plain http links are upgraded. */
  isHttps: boolean;
}

function buildContentSecurityPolicy({ isDev, isHttps }: SecurityHeaderOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React needs eval only in development, for its debugging tools.
    "script-src": ["'self'", "'unsafe-inline'", TURNSTILE, ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", CLOUDINARY_IMAGES],
    "font-src": ["'self'"],
    // Uploads go straight from the browser to Cloudinary; development also needs the reload socket.
    "connect-src": ["'self'", CLOUDINARY_UPLOAD, TURNSTILE, ...(isDev ? ["ws:"] : [])],
    "frame-src": [TURNSTILE],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(isHttps ? { "upgrade-insecure-requests": [] } : {}),
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}

export function buildSecurityHeaders(
  options: SecurityHeaderOptions,
): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    {
      key: "Strict-Transport-Security",
      value: `max-age=${String(TWO_YEARS_SECONDS)}; includeSubDomains; preload`,
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
    },
    // For browsers that predate `frame-ancestors`.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
