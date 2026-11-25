import { MapPinIcon } from "lucide-react";

import { LinkCard } from "@/components/shared/link-card";
import { INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import type { PublicInstitutionSummary } from "@/server/services/institution.service";

/** An institution on a list, with its photo when it has one. */
export function InstitutionCard({ institution }: { institution: PublicInstitutionSummary }) {
  return (
    <LinkCard
      href={`/institutions/${institution.slug}`}
      eyebrow={INSTITUTION_TYPE_LABELS[institution.type]}
      title={institution.name}
      image={institution.image}
      meta={
        <span className="flex items-center gap-2">
          <MapPinIcon className="size-4 text-gold-text" aria-hidden="true" />
          {institution.city}
        </span>
      }
      cta="View institution"
    />
  );
}
