import { ScrollTextIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { AuditLogFilter } from "@/features/audit-log/audit-log-filter";
import { AuditLogTable } from "@/features/audit-log/audit-log-table";
import { buildHref } from "@/lib/query-string";
import { auditLogQuerySchema } from "@/lib/validations/audit-log";
import { checkPagePermission } from "@/server/auth/session";
import { getAuditLog } from "@/server/services/audit-log.service";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage({ searchParams }: PageProps<"/portal/audit-log">) {
  const access = await checkPagePermission("audit:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = auditLogQuerySchema.parse(await searchParams);
  const { items, total } = await getAuditLog(query);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const params = {
    entityType: query.entityType,
    action: query.action,
    from: query.from,
    to: query.to,
  };
  const getHref = (page: number) =>
    buildHref("/portal/audit-log", { ...params, sort: query.sort, page });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change and every sensitive read, newest first. Read only."
      />
      <AuditLogFilter query={query} />
      {items.length === 0 ? (
        <EmptyState
          icon={ScrollTextIcon}
          title="No entries found"
          description="Nothing matches these filters yet."
        />
      ) : (
        <AuditLogTable
          entries={items}
          sorting={{ basePath: "/portal/audit-log", sort: query.sort, params }}
        />
      )}
      <Pagination page={query.page} pageCount={pageCount} getHref={getHref} className="mt-4" />
    </>
  );
}
