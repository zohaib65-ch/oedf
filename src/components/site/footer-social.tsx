import { connection } from "next/server";

import { getPublicSiteSettings } from "@/server/services/site-settings.service";

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
} as const;

/** Links to the foundation's social profiles. Nothing is shown until a link is added in Settings. */
export async function FooterSocial() {
  await connection();
  const settings = await getPublicSiteSettings();
  const links = Object.entries(SOCIAL_LABELS).flatMap(([key, label]) => {
    const url = settings?.social[key as keyof typeof SOCIAL_LABELS];
    return url ? [{ label, url }] : [];
  });
  if (links.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-bold tracking-widest text-gold uppercase">Connect with us</p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {links.map(({ label, url }) => (
          <li key={label}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 bg-card px-4 py-2 text-sm text-white hover:border-gold/40"
            >
              {label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
