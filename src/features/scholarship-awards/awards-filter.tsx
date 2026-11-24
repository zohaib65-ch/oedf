import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { AWARD_STATUS_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListAwardsQuery } from "@/lib/validations/application-review";

export function AwardsFilter({ query }: { query: ListAwardsQuery }) {
  return (
    <FilterBar
      basePath="/portal/scholarship-awards"
      label="Filter scholarship awards"
      resetKey={[query.q, query.status, query.renewalBefore].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="awards-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Student or reference"
        className="w-64"
      />
      <FilterSelect
        id="awards-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(AWARD_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-40"
      />
      <FilterInput
        id="awards-renewal"
        name="renewalBefore"
        label="Renewal on or before"
        type="date"
        value={query.renewalBefore}
        className="w-44"
      />
    </FilterBar>
  );
}
