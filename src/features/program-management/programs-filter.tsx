import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { CONTENT_STATUS_LABELS, PROGRAM_CATEGORY_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListProgramsQuery } from "@/lib/validations/program";

export function ProgramsFilter({ query }: { query: ListProgramsQuery }) {
  return (
    <FilterBar
      basePath="/portal/programs"
      label="Filter programs"
      resetKey={[query.q, query.status, query.category].join("|")}
      sort={query.sort}
    >
      <FilterInput id="programs-q" name="q" label="Search" value={query.q} placeholder="Title" />
      <FilterSelect
        id="programs-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(CONTENT_STATUS_LABELS)}
        allLabel="All statuses"
      />
      <FilterSelect
        id="programs-category"
        name="category"
        label="Category"
        value={query.category}
        options={toOptions(PROGRAM_CATEGORY_LABELS)}
        allLabel="All categories"
      />
    </FilterBar>
  );
}
