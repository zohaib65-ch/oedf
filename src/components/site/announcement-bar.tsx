import { MailIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

/**
 * The bar above the header: the announcement (text and link managed in portal Settings) and the
 * contact details. It is hidden until an announcement is switched on.
 */
export async function AnnouncementBar() {
  await connection();
  const settings = await getPublicSiteSettings();
  if (!settings?.announcement.isActive || !settings.announcement.text) {
    return null;
  }
  const { announcement, contact } = settings;

  return (
    <div className="hidden border-b border-gold/20 bg-linear-to-r from-navy-deep/90 via-topbar-mid to-topbar-end text-xs text-white/90 md:block">
      <Container className="flex min-h-8.25 items-center justify-between gap-6 py-1">
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
        <div className="flex items-center gap-6">
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
