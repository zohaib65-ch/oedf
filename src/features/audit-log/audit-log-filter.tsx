import { FilterBar, FilterInput } from "@/components/portal/list-filters";
import type { AuditLogQuery } from "@/lib/validations/audit-log";

export function AuditLogFilter({ query }: { query: AuditLogQuery }) {
  return (
    <FilterBar
      basePath="/portal/audit-log"
      label="Filter the audit log"
      resetKey={[query.entityType, query.action, query.from, query.to].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="audit-entityType"
        name="entityType"
        label="Record type"
        value={query.entityType}
        placeholder="For example User"
      />
      <FilterInput
        id="audit-action"
        name="action"
        label="Action"
        value={query.action}
        placeholder="For example user.created"
      />
      <FilterInput
        id="audit-from"
        name="from"
        label="From"
        type="date"
        value={query.from}
        className="w-44"
      />
      <FilterInput
        id="audit-to"
        name="to"
        label="To"
        type="date"
        value={query.to}
        className="w-44"
      />
    </FilterBar>
  );
}
