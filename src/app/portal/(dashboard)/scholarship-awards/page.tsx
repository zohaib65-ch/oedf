import { AwardIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { AwardsFilter } from "@/features/scholarship-awards/awards-filter";
import { AwardsTable } from "@/features/scholarship-awards/awards-table";
import { buildHref } from "@/lib/query-string";
import { listAwardsQuerySchema } from "@/lib/validations/application-review";
import { checkPagePermission } from "@/server/auth/session";
import { getAwards } from "@/server/services/scholarship-award.service";

export const metadata: Metadata = { title: "Scholarship awards" };

const BASE_PATH = "/portal/scholarship-awards";

export default async function AwardsPage({
  searchParams,
}: PageProps<"/portal/scholarship-awards">) {
  const access = await checkPagePermission("awards:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listAwardsQuerySchema.parse(await searchParams);
  const { items, total } = await getAwards(query);
  const params = { q: query.q, status: query.status, renewalBefore: query.renewalBefore };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Scholarship awards"
        description="Created when a scholarship is approved. Records only: no payments are made here."
      />
      <AwardsFilter query={query} />
      {items.length === 0 ? (
        <EmptyState
          icon={AwardIcon}
          title="No awards found"
          description="Awards appear here when scholarship applications are approved."
        />
      ) : (
        <AwardsTable awards={items} sorting={{ basePath: BASE_PATH, sort: query.sort, params }} />
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
