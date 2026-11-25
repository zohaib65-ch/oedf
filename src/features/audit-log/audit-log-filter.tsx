import { FilterBar, FilterDate, FilterInput } from "@/components/portal/list-filters";
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
      <FilterDate id="audit-from" name="from" label="From" value={query.from} />
      <FilterDate id="audit-to" name="to" label="To" value={query.to} />
    </FilterBar>
  );
}
