import { StatusBadge } from "@/components/portal/status-badge";
import type { INSTITUTION_STATUSES } from "@/lib/constants/enums";
import { INSTITUTION_STATUS_LABELS } from "@/lib/constants/labels";

type InstitutionStatus = (typeof INSTITUTION_STATUSES)[number];

const TONE = {
  PROPOSED: "progress",
  ACTIVE: "positive",
  SUSPENDED: "closed",
  CLOSED: "closed",
} as const satisfies Record<InstitutionStatus, "progress" | "positive" | "closed">;

/** The status, and whether the public site shows the institution (only when Active and public). */
export function InstitutionStatus({
  status,
  isPublic,
}: {
  status: InstitutionStatus;
  isPublic: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <StatusBadge label={INSTITUTION_STATUS_LABELS[status]} tone={TONE[status]} />
      {isPublic && status === "ACTIVE" ? (
        <StatusBadge label="On public site" tone="positive" />
      ) : null}
    </span>
  );
}
