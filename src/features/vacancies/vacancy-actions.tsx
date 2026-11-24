"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete, apiPost } from "@/lib/api/client";
import type { VACANCY_STATUSES } from "@/lib/constants/enums";
import { vacancyActionLabel } from "@/lib/constants/vacancy-workflow";

type VacancyStatus = (typeof VACANCY_STATUSES)[number];

const DESCRIPTIONS: Record<string, string> = {
  Publish: "It appears on the careers page at once, and people can apply until the deadline.",
  Reopen: "It appears on the careers page again, and people can apply until the deadline.",
  Close:
    "It leaves the careers page and no one else can apply. Applications already received stay.",
};

interface VacancyActionsProps {
  vacancyId: string;
  title: string;
  status: VacancyStatus;
  /** The moves this person may make. */
  nextStatuses: readonly VacancyStatus[];
  canDelete: boolean;
}

/** Publish, close or reopen, and delete a draft. Each asks before it acts. */
export function VacancyActions({
  vacancyId,
  title,
  status,
  nextStatuses,
  canDelete,
}: VacancyActionsProps) {
  const router = useRouter();

  return (
    <>
      {nextStatuses.map((target) => {
        const label = vacancyActionLabel(status, target);
        return (
          <ConfirmButton
            key={target}
            label={label}
            title={`${label} “${title}”?`}
            description={DESCRIPTIONS[label] ?? ""}
            variant={target === "CLOSED" ? "outline" : "default"}
            onConfirm={async () => {
              await apiPost(`/vacancies/${vacancyId}/status`, { status: target });
              toast.success(target === "CLOSED" ? "Vacancy closed." : "Vacancy published.");
              router.refresh();
            }}
          />
        );
      })}
      {canDelete ? (
        <ConfirmButton
          label="Delete draft"
          title={`Delete “${title}”?`}
          description="The draft is removed for good. This is recorded in the audit log."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            await apiDelete(`/vacancies/${vacancyId}`);
            toast.success("Draft deleted.");
            router.push("/portal/vacancies");
          }}
        />
      ) : null}
    </>
  );
}
