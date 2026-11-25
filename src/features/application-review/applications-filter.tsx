import { FilterBar, FilterDate, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TYPE_LABELS,
  toOptions,
} from "@/lib/constants/labels";
import type { ListApplicationsQuery } from "@/lib/validations/application-review";

interface ApplicationsFilterProps {
  query: ListApplicationsQuery;
  programs: readonly { value: string; label: string }[];
}

export function ApplicationsFilter({ query, programs }: ApplicationsFilterProps) {
  const resetKey = [
    query.q,
    query.type,
    query.status,
    query.programId,
    query.city,
    query.from,
    query.to,
    query.view,
  ].join("|");
  return (
    <FilterBar
      basePath="/portal/applications"
      label="Filter applications"
      resetKey={resetKey}
      sort={query.sort}
    >
      <FilterInput
        id="applications-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Name, reference or CNIC"
        size="lg"
      />
      <FilterSelect
        id="applications-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(APPLICATION_TYPE_LABELS)}
        allLabel="All types"
      />
      <FilterSelect
        id="applications-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(APPLICATION_STATUS_LABELS)}
        allLabel="All statuses"
      />
      <FilterSelect
        id="applications-program"
        name="programId"
        label="Program"
        value={query.programId}
        options={programs}
        allLabel="All programs"
        size="lg"
      />
      <FilterInput
        id="applications-city"
        name="city"
        label="City"
        placeholder="For example Lahore"
        value={query.city}
      />
      <FilterDate id="applications-from" name="from" label="Submitted from" value={query.from} />
      <FilterDate id="applications-to" name="to" label="Submitted to" value={query.to} />
      <FilterSelect
        id="applications-view"
        name="view"
        label="Show"
        value={query.view}
        options={[{ value: "ARCHIVED", label: "Archived" }]}
        allLabel="In progress"
      />
    </FilterBar>
  );
}
