import { StatusBadge } from "@/components/portal/status-badge";
import { VACANCY_STATUS_LABELS } from "@/lib/constants/labels";
import { vacancyStatusTone } from "@/lib/constants/vacancy-workflow";
import type { StaffVacancyListItem } from "@/server/repositories/vacancy-management.repository";

/** The shown status, saying so when a published vacancy closed because its deadline passed. */
export function VacancyStatus({
  vacancy,
}: {
  vacancy: Pick<StaffVacancyListItem, "status" | "shownStatus">;
}) {
  const hasExpired = vacancy.status === "PUBLISHED" && vacancy.shownStatus === "CLOSED";
  return (
    <StatusBadge
      label={
        hasExpired
          ? `${VACANCY_STATUS_LABELS.CLOSED} (deadline passed)`
          : VACANCY_STATUS_LABELS[vacancy.shownStatus]
      }
      tone={vacancyStatusTone(vacancy.shownStatus)}
    />
  );
}
