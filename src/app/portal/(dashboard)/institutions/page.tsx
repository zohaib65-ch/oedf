import { PlusIcon, SchoolIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { InstitutionsFilter } from "@/features/institution-management/institutions-filter";
import { InstitutionsTable } from "@/features/institution-management/institutions-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listInstitutionsQuerySchema } from "@/lib/validations/institution";
import { checkPagePermission } from "@/server/auth/session";
import { getInstitutionsForStaff } from "@/server/services/institution-management.service";

export const metadata: Metadata = { title: "Institutions" };

const BASE_PATH = "/portal/institutions";

export default async function InstitutionsPage({
  searchParams,
}: PageProps<"/portal/institutions">) {
  const access = await checkPagePermission("institutions:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listInstitutionsQuerySchema.parse(await searchParams);
  const { items, total } = await getInstitutionsForStaff(query);
  const params = { q: query.q, status: query.status, type: query.type };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Institutions"
        description="Schools, colleges and training centers, with their agreements and reviews. The public site shows only Active institutions marked public."
        actions={
          hasPermission(access.staff, "institutions:write") ? (
            <Button asChild>
              <Link href={`${BASE_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                New institution
              </Link>
            </Button>
          ) : null
        }
      />
      <InstitutionsFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 institution" : `${String(total)} institutions`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={SchoolIcon}
          title="No institutions found"
          description="Nothing matches these filters. Clear them to see every institution."
        />
      ) : (
        <InstitutionsTable
          institutions={items}
          sorting={{ basePath: BASE_PATH, sort: query.sort, params }}
          canDelete={
            hasPermission(access.staff, "institutions:write") &&
            hasPermission(access.staff, "content:delete")
          }
          canPublish={hasPermission(access.staff, "institutions:publish")}
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
