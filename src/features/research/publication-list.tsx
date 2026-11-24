import { FileTextIcon, SearchIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { Pagination } from "@/components/shared/pagination";
import { PublicationCard } from "@/components/site/publication-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PUBLICATION_TYPES } from "@/lib/constants/enums";
import { PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { buildHref } from "@/lib/query-string";
import { PAGE_SIZE, parsePublicationFilters } from "@/lib/validations/list-params";
import { getPublicationYears, getPublications } from "@/server/services/publication.service";

type SearchParams = Parameters<typeof parsePublicationFilters>[0];

export async function PublicationList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parsePublicationFilters(await searchParams);
  const [{ items, total }, years] = await Promise.all([
    getPublications(filters),
    getPublicationYears(),
  ]);
  // Changing a filter or the search starts again from the first page.
  const hrefWith = (changes: Partial<typeof filters>) =>
    buildHref("/research", { ...filters, page: 1, ...changes });

  return (
    <div className="space-y-10">
      <form action="/research" role="search" className="flex max-w-xl gap-3">
        {filters.type ? <Input type="hidden" name="type" value={filters.type} /> : null}
        {filters.year ? <Input type="hidden" name="year" value={filters.year} /> : null}
        <Input
          type="search"
          name="q"
          defaultValue={filters.q}
          maxLength={100}
          placeholder="Search research"
          aria-label="Search research"
          className="h-11"
        />
        <Button type="submit" className="h-11 rounded-full px-6">
          <SearchIcon aria-hidden="true" />
          Search
        </Button>
      </form>
      <div className="space-y-4">
        <FilterChips
          label="Type"
          options={[
            { label: "All", href: hrefWith({ type: undefined }), isActive: !filters.type },
            ...PUBLICATION_TYPES.map((type) => ({
              label: PUBLICATION_TYPE_LABELS[type],
              href: hrefWith({ type }),
              isActive: filters.type === type,
            })),
          ]}
        />
        {years.length > 0 ? (
          <FilterChips
            label="Year"
            options={[
              { label: "All", href: hrefWith({ year: undefined }), isActive: !filters.year },
              ...years.map((year) => ({
                label: String(year),
                href: hrefWith({ year }),
                isActive: filters.year === year,
              })),
            ]}
          />
        ) : null}
      </div>
      {items.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
          <Pagination
            page={filters.page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            getHref={(page) => hrefWith({ page })}
          />
        </>
      ) : (
        <EmptyState
          icon={FileTextIcon}
          title="No publications found"
          description="Nothing matches this search. Try different words or clear a filter."
        />
      )}
    </div>
  );
}
