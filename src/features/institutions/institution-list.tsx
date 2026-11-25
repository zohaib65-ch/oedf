import { SchoolIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { InstitutionCard } from "@/components/site/institution-card";
import { INSTITUTION_TYPES } from "@/lib/constants/enums";
import { INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import { buildHref } from "@/lib/query-string";
import { parseInstitutionFilters } from "@/lib/validations/list-params";
import { getInstitutionCities, getInstitutions } from "@/server/services/institution.service";

type SearchParams = Parameters<typeof parseInstitutionFilters>[0];

export async function InstitutionList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseInstitutionFilters(await searchParams);
  const [institutions, cities] = await Promise.all([
    getInstitutions(filters),
    getInstitutionCities(),
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <FilterChips
          label="Type"
          options={[
            {
              label: "All",
              href: buildHref("/institutions", { city: filters.city }),
              isActive: !filters.type,
            },
            ...INSTITUTION_TYPES.map((type) => ({
              label: INSTITUTION_TYPE_LABELS[type],
              href: buildHref("/institutions", { city: filters.city, type }),
              isActive: filters.type === type,
            })),
          ]}
        />
        {cities.length > 1 ? (
          <FilterChips
            label="City"
            options={[
              {
                label: "All",
                href: buildHref("/institutions", { type: filters.type }),
                isActive: !filters.city,
              },
              ...cities.map((city) => ({
                label: city,
                href: buildHref("/institutions", { city, type: filters.type }),
                isActive: filters.city === city,
              })),
            ]}
          />
        ) : null}
      </div>
      {institutions.length > 0 ? (
        <>
          <h2 className="sr-only">Institutions</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <InstitutionCard key={institution.id} institution={institution} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={SchoolIcon}
          title="No institutions to show"
          description="No institutions match these filters. Try removing one, or check back soon."
        />
      )}
    </div>
  );
}
