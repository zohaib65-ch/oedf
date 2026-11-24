import { MapPinIcon } from "lucide-react";

import { LinkCard } from "@/components/shared/link-card";
import { INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import type { InstitutionSummary } from "@/server/repositories/institution.repository";

export function InstitutionCard({ institution }: { institution: InstitutionSummary }) {
  return (
    <LinkCard
      href={`/institutions/${institution.slug}`}
      eyebrow={INSTITUTION_TYPE_LABELS[institution.type]}
      title={institution.name}
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
