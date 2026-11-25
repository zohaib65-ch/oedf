import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import {
  INSTITUTION_STATUS_LABELS,
  INSTITUTION_TYPE_LABELS,
  toOptions,
} from "@/lib/constants/labels";
import type { ListInstitutionsQuery } from "@/lib/validations/institution";

export function InstitutionsFilter({ query }: { query: ListInstitutionsQuery }) {
  return (
    <FilterBar
      basePath="/portal/institutions"
      label="Filter institutions"
      resetKey={[query.q, query.status, query.type].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="institutions-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Name or city"
      />
      <FilterSelect
        id="institutions-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(INSTITUTION_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-40"
      />
      <FilterSelect
        id="institutions-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(INSTITUTION_TYPE_LABELS)}
        allLabel="All types"
        className="w-44"
      />
    </FilterBar>
  );
}
