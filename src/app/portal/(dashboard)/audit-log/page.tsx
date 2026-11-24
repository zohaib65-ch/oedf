import { ScrollTextIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { AuditLogFilter } from "@/features/audit-log/audit-log-filter";
import { AuditLogTable } from "@/features/audit-log/audit-log-table";
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
  const getHref = (page: number) => {
    const params = new URLSearchParams();
    for (const key of ["entityType", "action", "from", "to"] as const) {
      const value = query[key];
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `/portal/audit-log?${params.toString()}`;
  };

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
        <AuditLogTable entries={items} />
      )}
      <Pagination page={query.page} pageCount={pageCount} getHref={getHref} className="mt-4" />
    </>
  );
}
