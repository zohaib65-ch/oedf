import type { VACANCY_STATUSES } from "@/lib/constants/enums";

type VacancyStatus = (typeof VACANCY_STATUSES)[number];

/**
 * Draft → Published → Closed, and a closed vacancy can be published again. Every move needs
 * `vacancies:publish`, which only a Director (and Super Admin) holds.
 */
export const VACANCY_TRANSITIONS: Record<VacancyStatus, readonly VacancyStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["CLOSED"],
  CLOSED: ["PUBLISHED"],
};

/** The status visitors and staff see: a published vacancy past its deadline is closed. */
export function effectiveVacancyStatus(
  status: VacancyStatus,
  deadline: string,
  now: number = Date.now(),
): VacancyStatus {
  return status === "PUBLISHED" && new Date(deadline).getTime() < now ? "CLOSED" : status;
}

/** The button text for a move, which depends on where the vacancy is now. */
export function vacancyActionLabel(from: VacancyStatus, to: VacancyStatus): string {
  if (to === "CLOSED") {
    return "Close";
  }
  return from === "CLOSED" ? "Reopen" : "Publish";
}

export function vacancyStatusTone(status: VacancyStatus): "progress" | "positive" | "closed" {
  if (status === "PUBLISHED") {
    return "positive";
  }
  return status === "CLOSED" ? "closed" : "progress";
}
