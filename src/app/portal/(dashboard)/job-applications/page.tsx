import { FileUserIcon } from "lucide-react";
import type { Metadata } from "next";

import { ExportCsvButton } from "@/components/portal/export-csv-button";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { JobApplicationsFilter } from "@/features/job-application-review/job-applications-filter";
import { JobApplicationsTable } from "@/features/job-application-review/job-applications-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listJobApplicationsQuerySchema } from "@/lib/validations/job-application-review";
import { checkPagePermission } from "@/server/auth/session";
import { getJobApplications } from "@/server/services/job-application-review.service";
import { getVacancyOptions } from "@/server/services/vacancy-management.service";

export const metadata: Metadata = { title: "Job applications" };

const BASE_PATH = "/portal/job-applications";

export default async function JobApplicationsPage({
  searchParams,
}: PageProps<"/portal/job-applications">) {
  const access = await checkPagePermission("job-applications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listJobApplicationsQuerySchema.parse(await searchParams);
  const [{ items, total }, vacancies] = await Promise.all([
    getJobApplications(query),
    getVacancyOptions(),
  ]);
  const params = {
    q: query.q,
    vacancyId: query.vacancyId,
    status: query.status,
    view: query.view,
  };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const noun = query.view === "ARCHIVED" ? "archived application" : "application";

  return (
    <>
      <PageHeader
        title="Job applications"
        description="Candidates for every vacancy. Lists show only the last four CNIC digits."
        actions={
          hasPermission(access.staff, "job-applications:export") ? (
            <ExportCsvButton
              href={buildHref("/api/v1/job-applications/export", { ...params, sort: query.sort })}
            />
          ) : null
        }
      />
      <JobApplicationsFilter
        query={query}
        vacancies={vacancies.map((vacancy) => ({ value: vacancy.id, label: vacancy.title }))}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? `1 ${noun}` : `${String(total)} ${noun}s`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={FileUserIcon}
          title="No job applications found"
          description="Nothing matches these filters. Clear them to see every application in progress."
        />
      ) : (
        <JobApplicationsTable
          applications={items}
          sorting={{ basePath: BASE_PATH, sort: query.sort, params }}
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
