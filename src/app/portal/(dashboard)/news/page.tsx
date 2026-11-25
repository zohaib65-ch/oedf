import { NewspaperIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { NewsFilter } from "@/features/news-management/news-filter";
import { NewsTable } from "@/features/news-management/news-table";
import { buildHref } from "@/lib/query-string";
import { listNewsQuerySchema } from "@/lib/validations/news";
import { checkPagePermission } from "@/server/auth/session";
import { getNewsForStaff } from "@/server/services/news-management.service";

export const metadata: Metadata = { title: "News and events" };

const BASE_PATH = "/portal/news";

export default async function NewsPage({ searchParams }: PageProps<"/portal/news">) {
  const access = await checkPagePermission("news:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listNewsQuerySchema.parse(await searchParams);
  const { items, total } = await getNewsForStaff(query);
  const params = { q: query.q, status: query.status, type: query.type };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="News and events"
        description="Posts on the public News page. Events also show their date and venue."
        actions={
          <Button asChild>
            <Link href={`${BASE_PATH}/new`}>
              <PlusIcon aria-hidden="true" />
              New post
            </Link>
          </Button>
        }
      />
      <NewsFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 post" : `${String(total)} posts`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={NewspaperIcon}
          title="No posts found"
          description="Nothing matches these filters. Clear them to see every post."
        />
      ) : (
        <NewsTable posts={items} sorting={{ basePath: BASE_PATH, sort: query.sort, params }} />
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
