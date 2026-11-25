import { MegaphoneIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { DirectivesFilter } from "@/features/directive-management/directives-filter";
import { DirectivesTable } from "@/features/directive-management/directives-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listDirectivesQuerySchema } from "@/lib/validations/directive";
import { checkPagePermission } from "@/server/auth/session";
import { getDirectives } from "@/server/services/directive.service";

export const metadata: Metadata = { title: "Directives" };

const BASE_PATH = "/portal/directives";

export default async function DirectivesPage({ searchParams }: PageProps<"/portal/directives">) {
  const access = await checkPagePermission("directives:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listDirectivesQuerySchema.parse(await searchParams);
  const { items, total } = await getDirectives(access.staff, query);
  const params = { q: query.q, status: query.status, priority: query.priority, show: query.show };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Directives"
        description="Instructions from the Research & Policy Institute. Each office acknowledges, names an owner and reports progress on its part."
        actions={
          hasPermission(access.staff, "directives:issue") ? (
            <Button asChild>
              <Link href={`${BASE_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                Issue directive
              </Link>
            </Button>
          ) : null
        }
      />
      <DirectivesFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 directive" : `${String(total)} directives`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="No directives found"
          description="Nothing matches these filters, or no directive has been addressed to your office."
        />
      ) : (
        <DirectivesTable
          directives={items}
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
