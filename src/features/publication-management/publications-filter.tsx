import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { CONTENT_STATUS_LABELS, PUBLICATION_TYPE_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListPublicationsQuery } from "@/lib/validations/publication";

export function PublicationsFilter({ query }: { query: ListPublicationsQuery }) {
  return (
    <FilterBar
      basePath="/portal/publications"
      label="Filter publications"
      resetKey={[query.q, query.status, query.type].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="publications-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Title"
      />
      <FilterSelect
        id="publications-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(CONTENT_STATUS_LABELS)}
        allLabel="All statuses"
      />
      <FilterSelect
        id="publications-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(PUBLICATION_TYPE_LABELS)}
        allLabel="All types"
      />
    </FilterBar>
  );
}
