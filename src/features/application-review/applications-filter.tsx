import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
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
        className="w-64"
      />
      <FilterSelect
        id="applications-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(APPLICATION_TYPE_LABELS)}
        allLabel="All types"
        className="w-40"
      />
      <FilterSelect
        id="applications-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(APPLICATION_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-44"
      />
      <FilterSelect
        id="applications-program"
        name="programId"
        label="Program"
        value={query.programId}
        options={programs}
        allLabel="All programs"
        className="w-56"
      />
      <FilterInput
        id="applications-city"
        name="city"
        label="City"
        value={query.city}
        className="w-40"
      />
      <FilterInput
        id="applications-from"
        name="from"
        label="Submitted from"
        type="date"
        value={query.from}
        className="w-44"
      />
      <FilterInput
        id="applications-to"
        name="to"
        label="Submitted to"
        type="date"
        value={query.to}
        className="w-44"
      />
    </FilterBar>
  );
}
