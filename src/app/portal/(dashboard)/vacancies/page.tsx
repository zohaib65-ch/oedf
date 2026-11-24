import { BriefcaseBusinessIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { VacanciesFilter } from "@/features/vacancies/vacancies-filter";
import { VacanciesTable } from "@/features/vacancies/vacancies-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listVacanciesQuerySchema } from "@/lib/validations/vacancy";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartments } from "@/server/services/department.service";
import { getVacanciesForStaff } from "@/server/services/vacancy-management.service";

export const metadata: Metadata = { title: "Vacancies" };

const BASE_PATH = "/portal/vacancies";

export default async function VacanciesPage({ searchParams }: PageProps<"/portal/vacancies">) {
  const access = await checkPagePermission("vacancies:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listVacanciesQuerySchema.parse(await searchParams);
  const [{ items, total }, offices] = await Promise.all([
    getVacanciesForStaff(query),
    getDepartments(),
  ]);
  const params = {
    q: query.q,
    status: query.status,
    departmentId: query.departmentId,
    type: query.type,
  };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Vacancies"
        description="Jobs on the careers page. A published vacancy closes by itself after its deadline."
        actions={
          hasPermission(access.staff, "vacancies:write") ? (
            <Button asChild>
              <Link href={`${BASE_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                New vacancy
              </Link>
            </Button>
          ) : null
        }
      />
      <VacanciesFilter
        query={query}
        offices={offices.map((office) => ({ value: office.id, label: office.name }))}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 vacancy" : `${total} vacancies`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusinessIcon}
          title="No vacancies found"
          description="Nothing matches these filters. Clear them to see every vacancy."
        />
      ) : (
        <VacanciesTable
          vacancies={items}
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
