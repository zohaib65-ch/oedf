import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
import { Badge } from "@/components/ui/badge";
import type { ASSIGNMENT_STATUSES, DIRECTIVE_PRIORITIES } from "@/lib/constants/enums";
import { ASSIGNMENT_STATUS_LABELS, DIRECTIVE_PRIORITY_LABELS } from "@/lib/constants/labels";

/** Solid red with white text: the light red badge fails contrast at badge size. */
const ALERT_BADGE_CLASS = "bg-destructive text-white";

const STATUS_TONE = {
  PENDING_ACKNOWLEDGEMENT: "progress",
  ACKNOWLEDGED: "progress",
  IN_PROGRESS: "progress",
  CLARIFICATION_REQUESTED: "progress",
  COMPLETED: "positive",
  CLOSED: "closed",
} as const satisfies Record<(typeof ASSIGNMENT_STATUSES)[number], StatusTone>;

export function AssignmentStatusBadge({
  status,
}: {
  status: (typeof ASSIGNMENT_STATUSES)[number];
}) {
  return <StatusBadge label={ASSIGNMENT_STATUS_LABELS[status]} tone={STATUS_TONE[status]} />;
}

/** High and urgent priorities stand out; the word carries the meaning. */
export function PriorityBadge({ priority }: { priority: (typeof DIRECTIVE_PRIORITIES)[number] }) {
  const isPressing = priority === "HIGH" || priority === "URGENT";
  return (
    <Badge
      variant={isPressing ? "destructive" : "outline"}
      className={isPressing ? ALERT_BADGE_CLASS : undefined}
    >
      {DIRECTIVE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

/** Says "Overdue" in words, so the highlight never relies on colour alone. */
export function OverdueBadge() {
  return (
    <Badge variant="destructive" className={ALERT_BADGE_CLASS}>
      Overdue
    </Badge>
  );
}
