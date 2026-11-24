import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { connection } from "next/server";

import { getPublicSiteSettings } from "@/server/services/site-settings.service";

/** Address, phone, email and office hours from portal Settings. */
export async function FooterContact() {
  await connection();
  const settings = await getPublicSiteSettings();
  if (!settings) {
    return null;
  }
  const { address, phone, email, officeHours } = settings.contact;

  return (
    <ul className="space-y-3 text-sm">
      {address ? (
        <li className="flex gap-3 border-l-2 border-gold/40 pl-4">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          <span>{address}</span>
        </li>
      ) : null}
      {phone ? (
        <li>
          <a
            href={`tel:${phone.replaceAll(" ", "")}`}
            className="flex items-center gap-3 hover:text-white"
          >
            <PhoneIcon className="size-4 shrink-0 text-gold" aria-hidden="true" />
            {phone}
          </a>
        </li>
      ) : null}
      {email ? (
        <li>
          <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-white">
            <MailIcon className="size-4 shrink-0 text-gold" aria-hidden="true" />
            {email}
          </a>
        </li>
      ) : null}
      {officeHours ? <li className="pl-7 text-gray-400">{officeHours}</li> : null}
    </ul>
  );
}
