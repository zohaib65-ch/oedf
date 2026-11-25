import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { JOB_APPLICATION_STATUS_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListJobApplicationsQuery } from "@/lib/validations/job-application-review";

interface JobApplicationsFilterProps {
  query: ListJobApplicationsQuery;
  vacancies: readonly { value: string; label: string }[];
}

export function JobApplicationsFilter({ query, vacancies }: JobApplicationsFilterProps) {
  const resetKey = [query.q, query.vacancyId, query.status, query.view].join("|");
  return (
    <FilterBar
      basePath="/portal/job-applications"
      label="Filter job applications"
      resetKey={resetKey}
      sort={query.sort}
    >
      <FilterInput
        id="job-applications-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Name, reference or CNIC"
        size="lg"
      />
      <FilterSelect
        id="job-applications-vacancy"
        name="vacancyId"
        label="Vacancy"
        value={query.vacancyId}
        options={vacancies}
        allLabel="All vacancies"
        size="lg"
      />
      <FilterSelect
        id="job-applications-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(JOB_APPLICATION_STATUS_LABELS)}
        allLabel="All statuses"
      />
      <FilterSelect
        id="job-applications-view"
        name="view"
        label="Show"
        value={query.view}
        options={[{ value: "ARCHIVED", label: "Archived" }]}
        allLabel="In progress"
      />
    </FilterBar>
  );
}
