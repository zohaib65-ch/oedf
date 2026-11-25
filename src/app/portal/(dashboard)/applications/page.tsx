import { ClipboardListIcon } from "lucide-react";
import type { Metadata } from "next";

import { ExportCsvButton } from "@/components/portal/export-csv-button";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ApplicationsFilter } from "@/features/application-review/applications-filter";
import { ApplicationsTable } from "@/features/application-review/applications-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listApplicationsQuerySchema } from "@/lib/validations/application-review";
import { checkPagePermission } from "@/server/auth/session";
import { getApplications } from "@/server/services/application-review.service";
import { getProgramOptions } from "@/server/services/program.service";

export const metadata: Metadata = { title: "Applications" };

const BASE_PATH = "/portal/applications";

export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/portal/applications">) {
  const access = await checkPagePermission("applications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listApplicationsQuerySchema.parse(await searchParams);
  const [{ items, total }, programs] = await Promise.all([
    getApplications(query),
    getProgramOptions(),
  ]);
  const params = {
    q: query.q,
    type: query.type,
    status: query.status,
    programId: query.programId,
    city: query.city,
    from: query.from,
    to: query.to,
    view: query.view,
  };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const noun = query.view === "ARCHIVED" ? "archived application" : "application";

  return (
    <>
      <PageHeader
        title="Applications"
        description="Admission and scholarship applications. Lists show only the last four CNIC digits."
        actions={
          hasPermission(access.staff, "applications:export") ? (
            <ExportCsvButton
              href={buildHref("/api/v1/applications/export", { ...params, sort: query.sort })}
            />
          ) : null
        }
      />
      <ApplicationsFilter
        query={query}
        programs={programs.map((program) => ({ value: program.id, label: program.title }))}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? `1 ${noun}` : `${String(total)} ${noun}s`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No applications found"
          description="Nothing matches these filters. Clear them to see every application."
        />
      ) : (
        <ApplicationsTable
          applications={items}
          sorting={{ basePath: BASE_PATH, sort: query.sort, params }}
          canDelete={
            hasPermission(access.staff, "applications:decide") &&
            hasPermission(access.staff, "content:delete")
          }
        />
      )}
      <Pagination
        page={query.page}
        pageCount={pageCount}
        getHref={(page) => buildHref(BASE_PATH, { ...params, sort: query.sort, page })}
        className="mt-4"
      />
    </>
  );
}
