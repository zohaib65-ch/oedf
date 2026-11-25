import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { CONTENT_STATUS_LABELS, NEWS_TYPE_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListNewsQuery } from "@/lib/validations/news";

export function NewsFilter({ query }: { query: ListNewsQuery }) {
  return (
    <FilterBar
      basePath="/portal/news"
      label="Filter news and events"
      resetKey={[query.q, query.status, query.type].join("|")}
      sort={query.sort}
    >
      <FilterInput id="news-q" name="q" label="Search" value={query.q} placeholder="Title" />
      <FilterSelect
        id="news-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(CONTENT_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-40"
      />
      <FilterSelect
        id="news-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(NEWS_TYPE_LABELS)}
        allLabel="News and events"
        className="w-44"
      />
    </FilterBar>
  );
}
