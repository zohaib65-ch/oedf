import { MailIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

const TOP_BAR_CLASSES =
  "hidden border-b border-gold/20 bg-linear-to-r from-navy-deep/90 via-topbar-mid to-topbar-end text-xs text-white/90 md:block";

/**
 * Holds the bar's place while its content loads, so the header does not jump when the bar appears.
 * It matches the bar's height (one row of text plus its padding).
 */
export function TopBarFallback() {
  return (
    <div className={TOP_BAR_CLASSES} aria-hidden="true">
      <div className="min-h-8.25" />
    </div>
  );
}

/**
 * The bar above the header: contact details, plus an optional announcement (text and link managed in
 * portal Settings). It shows whenever Settings has a phone number or an email address.
 */
export async function TopBar() {
  await connection();
  const settings = await getPublicSiteSettings();
  if (!settings?.contact.phone && !settings?.contact.email) {
    return null;
  }
  const { announcement, contact } = settings;
  const hasAnnouncement = announcement.isActive && announcement.text !== "";

  return (
    <div className={TOP_BAR_CLASSES}>
      <Container className="flex min-h-8.25 items-center justify-between gap-6 py-1">
        {hasAnnouncement ? (
          <p className="flex items-center gap-2 font-medium text-gold">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
            {announcement.linkUrl ? (
              <Link href={announcement.linkUrl} className="hover:underline">
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </p>
        ) : null}
        <div className="ml-auto flex items-center gap-6">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone.replaceAll(" ", "")}`}
              className="flex items-center gap-2 hover:text-gold"
            >
              <PhoneIcon className="size-3.5 text-gold" aria-hidden="true" />
              {contact.phone}
            </a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-gold">
              <MailIcon className="size-3.5 text-gold" aria-hidden="true" />
              {contact.email}
            </a>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
