import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import {
  ASSIGNMENT_STATUS_LABELS,
  DIRECTIVE_PRIORITY_LABELS,
  toOptions,
} from "@/lib/constants/labels";
import type { ListDirectivesQuery } from "@/lib/validations/directive";

const SHOW_OPTIONS = [{ value: "OVERDUE", label: "Overdue only" }] as const;

export function DirectivesFilter({ query }: { query: ListDirectivesQuery }) {
  return (
    <FilterBar
      basePath="/portal/directives"
      label="Filter directives"
      resetKey={[query.q, query.status, query.priority, query.show].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="directives-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Title or reference"
      />
      <FilterSelect
        id="directives-status"
        name="status"
        label="Office status"
        value={query.status}
        options={toOptions(ASSIGNMENT_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-56"
      />
      <FilterSelect
        id="directives-priority"
        name="priority"
        label="Priority"
        value={query.priority}
        options={toOptions(DIRECTIVE_PRIORITY_LABELS)}
        allLabel="All priorities"
        className="w-40"
      />
      <FilterSelect
        id="directives-show"
        name="show"
        label="Due"
        value={query.show}
        options={SHOW_OPTIONS}
        allLabel="Any due date"
        className="w-40"
      />
    </FilterBar>
  );
}
