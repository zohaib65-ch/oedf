import { GraduationCapIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { ProgramsFilter } from "@/features/program-management/programs-filter";
import { ProgramsTable } from "@/features/program-management/programs-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listProgramsQuerySchema } from "@/lib/validations/program";
import { checkPagePermission } from "@/server/auth/session";
import { getProgramsForStaff } from "@/server/services/program-management.service";

export const metadata: Metadata = { title: "Programs" };

const BASE_PATH = "/portal/programs";

export default async function ProgramsPage({ searchParams }: PageProps<"/portal/programs">) {
  const access = await checkPagePermission("programs:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listProgramsQuerySchema.parse(await searchParams);
  const { items, total } = await getProgramsForStaff(query);
  const params = { q: query.q, status: query.status, category: query.category };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Programs"
        description="Programs on the public site. Published programs that accept applications appear in the admission form."
        actions={
          hasPermission(access.staff, "programs:write") ? (
            <Button asChild>
              <Link href={`${BASE_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                New program
              </Link>
            </Button>
          ) : null
        }
      />
      <ProgramsFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 program" : `${String(total)} programs`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={GraduationCapIcon}
          title="No programs found"
          description="Nothing matches these filters. Clear them to see every program."
        />
      ) : (
        <ProgramsTable
          programs={items}
          sorting={{ basePath: BASE_PATH, sort: query.sort, params }}
          canDelete={hasPermission(access.staff, "programs:write")}
          canPublish={hasPermission(access.staff, "programs:publish")}
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
