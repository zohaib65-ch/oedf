import { NewspaperIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { Pagination } from "@/components/shared/pagination";
import { NewsCard } from "@/components/site/news-card";
import { NEWS_TYPES } from "@/lib/constants/enums";
import { NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { buildHref } from "@/lib/query-string";
import { PAGE_SIZE, parseNewsFilters } from "@/lib/validations/list-params";
import { getNews } from "@/server/services/news.service";

type SearchParams = Parameters<typeof parseNewsFilters>[0];

export async function NewsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseNewsFilters(await searchParams);
  const { items, total } = await getNews(filters);

  return (
    <div className="space-y-10">
      <FilterChips
        label="Show"
        options={[
          { label: "All", href: "/news", isActive: !filters.type },
          ...NEWS_TYPES.map((type) => ({
            label: NEWS_TYPE_LABELS[type],
            href: buildHref("/news", { type }),
            isActive: filters.type === type,
          })),
        ]}
      />
      {items.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            page={filters.page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            getHref={(page) => buildHref("/news", { type: filters.type, page })}
          />
        </>
      ) : (
        <EmptyState
          icon={NewspaperIcon}
          title="No news yet"
          description="No articles or events are published here yet. Please check back soon."
        />
      )}
    </div>
  );
}
