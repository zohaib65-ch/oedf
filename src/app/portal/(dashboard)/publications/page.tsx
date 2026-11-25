import { LibraryBigIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { PublicationsFilter } from "@/features/publication-management/publications-filter";
import { PublicationsTable } from "@/features/publication-management/publications-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listPublicationsQuerySchema } from "@/lib/validations/publication";
import { checkPagePermission } from "@/server/auth/session";
import { getPublicationsForStaff } from "@/server/services/publication-management.service";

export const metadata: Metadata = { title: "Publications" };

const BASE_PATH = "/portal/publications";

export default async function PublicationsPage({
  searchParams,
}: PageProps<"/portal/publications">) {
  const access = await checkPagePermission("publications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listPublicationsQuerySchema.parse(await searchParams);
  const { items, total } = await getPublicationsForStaff(query);
  const params = { q: query.q, status: query.status, type: query.type };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Publications"
        description="Research reports, policy papers and briefs. Published ones appear on the Research page."
        actions={
          hasPermission(access.staff, "publications:write") ? (
            <Button asChild>
              <Link href={`${BASE_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                New publication
              </Link>
            </Button>
          ) : null
        }
      />
      <PublicationsFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 publication" : `${String(total)} publications`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={LibraryBigIcon}
          title="No publications found"
          description="Nothing matches these filters. Clear them to see every publication."
        />
      ) : (
        <PublicationsTable
          publications={items}
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
