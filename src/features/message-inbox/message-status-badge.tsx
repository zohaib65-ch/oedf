import { StatusBadge } from "@/components/portal/status-badge";
import type { MESSAGE_STATUSES } from "@/lib/constants/enums";
import { MESSAGE_STATUS_LABELS } from "@/lib/constants/labels";

const TONE = { NEW: "positive", READ: "progress", REPLIED: "closed", ARCHIVED: "closed" } as const;

export function MessageStatusBadge({ status }: { status: (typeof MESSAGE_STATUSES)[number] }) {
  return <StatusBadge label={MESSAGE_STATUS_LABELS[status]} tone={TONE[status]} />;
}
