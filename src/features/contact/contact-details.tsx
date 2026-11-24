import { ClockIcon, ExternalLinkIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

/** Address, phone, email, office hours and a map link, all from portal Settings. */
export async function ContactDetails() {
  await connection();
  const settings = await getPublicSiteSettings();
  const { address, phone, email, officeHours } = settings?.contact ?? {
    address: "",
    phone: "",
    email: "",
    officeHours: "",
  };
  const mapUrl = settings?.mapUrl ?? "";

  if (!address && !phone && !email && !officeHours) {
    return (
      <EmptyState
        icon={MailIcon}
        title="Contact details are coming soon"
        description="We are still adding our contact details. Please check back shortly."
      />
    );
  }

  const rows = [
    { icon: MapPinIcon, label: "Address", value: address, href: undefined },
    { icon: PhoneIcon, label: "Phone", value: phone, href: `tel:${phone.replaceAll(" ", "")}` },
    { icon: MailIcon, label: "Email", value: email, href: `mailto:${email}` },
    { icon: ClockIcon, label: "Office hours", value: officeHours, href: undefined },
  ].filter((row) => row.value !== "");

  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-card md:p-10">
      <ul className="space-y-6">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xs font-bold tracking-widest text-gold-text uppercase">
                {label}
              </h2>
              {href ? (
                <a href={href} className="mt-1 block text-lg text-foreground hover:underline">
                  {value}
                </a>
              ) : (
                <p className="mt-1 text-lg whitespace-pre-line text-foreground">{value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-navy hover:underline"
        >
          View on the map
          <ExternalLinkIcon className="size-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}
