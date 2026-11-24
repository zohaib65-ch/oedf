import { ClockIcon } from "lucide-react";

import { LinkCard } from "@/components/shared/link-card";
import { PROGRAM_CATEGORY_LABELS } from "@/lib/constants/labels";
import type { ProgramSummary } from "@/server/repositories/program.repository";

export function ProgramCard({ program }: { program: ProgramSummary }) {
  return (
    <LinkCard
      href={`/programs/${program.slug}`}
      eyebrow={PROGRAM_CATEGORY_LABELS[program.category]}
      title={program.title}
      description={program.summary}
      meta={
        program.duration ? (
          <span className="flex items-center gap-2">
            <ClockIcon className="size-4 text-gold-text" aria-hidden="true" />
            {program.duration}
          </span>
        ) : null
      }
      cta="View program"
    />
  );
}
