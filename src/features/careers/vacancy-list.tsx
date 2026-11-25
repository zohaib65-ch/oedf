import { BriefcaseIcon, CalendarClockIcon, MapPinIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { LinkCard } from "@/components/shared/link-card";
import { EMPLOYMENT_TYPES } from "@/lib/constants/enums";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import { buildHref } from "@/lib/query-string";
import { parseVacancyFilters } from "@/lib/validations/list-params";
import { getDepartments } from "@/server/services/department.service";
import { getOpenVacancies, getOpenVacancyCities } from "@/server/services/vacancy.service";

type SearchParams = Parameters<typeof parseVacancyFilters>[0];

export async function VacancyList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseVacancyFilters(await searchParams);
  const [vacancies, cities, departments] = await Promise.all([
    getOpenVacancies(filters),
    getOpenVacancyCities(),
    getDepartments(),
  ]);
  const hrefWith = (changes: Partial<typeof filters>) =>
    buildHref("/careers", { ...filters, ...changes });

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <FilterChips
          label="Department"
          options={[
            {
              label: "All",
              href: hrefWith({ department: undefined }),
              isActive: !filters.department,
            },
            ...departments.map((department) => ({
              label: department.name,
              href: hrefWith({ department: department.slug }),
              isActive: filters.department === department.slug,
            })),
          ]}
        />
        <FilterChips
          label="Type"
          options={[
            { label: "All", href: hrefWith({ type: undefined }), isActive: !filters.type },
            ...EMPLOYMENT_TYPES.map((type) => ({
              label: EMPLOYMENT_TYPE_LABELS[type],
              href: hrefWith({ type }),
              isActive: filters.type === type,
            })),
          ]}
        />
        {cities.length > 1 ? (
          <FilterChips
            label="City"
            options={[
              { label: "All", href: hrefWith({ city: undefined }), isActive: !filters.city },
              ...cities.map((city) => ({
                label: city,
                href: hrefWith({ city }),
                isActive: filters.city === city,
              })),
            ]}
          />
        ) : null}
      </div>
      {vacancies.length > 0 ? (
        <>
          <h2 className="sr-only">Open vacancies</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((vacancy) => (
              <LinkCard
                key={vacancy.id}
                href={`/careers/${vacancy.slug}`}
                eyebrow={vacancy.departmentName}
                title={vacancy.title}
                meta={
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <MapPinIcon className="size-4 text-gold-text" aria-hidden="true" />
                      {vacancy.city}
                    </li>
                    <li className="flex items-center gap-2">
                      <BriefcaseIcon className="size-4 text-gold-text" aria-hidden="true" />
                      {EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]}
                    </li>
                    <li className="flex items-center gap-2">
                      <CalendarClockIcon className="size-4 text-gold-text" aria-hidden="true" />
                      Apply by{" "}
                      <time dateTime={vacancy.deadline.toISOString()}>
                        {formatDate(vacancy.deadline)}
                      </time>
                    </li>
                  </ul>
                }
                cta="View vacancy"
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={BriefcaseIcon}
          title="No open vacancies"
          description="There are no vacancies that match these filters right now. Please check back soon."
        />
      )}
    </div>
  );
}
