import { GraduationCapIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { ProgramCard } from "@/components/site/program-card";
import { PROGRAM_CATEGORIES } from "@/lib/constants/enums";
import { PROGRAM_CATEGORY_LABELS } from "@/lib/constants/labels";
import { buildHref } from "@/lib/query-string";
import { parseProgramFilters } from "@/lib/validations/list-params";
import { getPrograms } from "@/server/services/program.service";

type SearchParams = Parameters<typeof parseProgramFilters>[0];

export async function ProgramList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseProgramFilters(await searchParams);
  const programs = await getPrograms(filters);

  return (
    <div className="space-y-10">
      <FilterChips
        label="Category"
        options={[
          { label: "All", href: "/programs", isActive: !filters.category },
          ...PROGRAM_CATEGORIES.map((category) => ({
            label: PROGRAM_CATEGORY_LABELS[category],
            href: buildHref("/programs", { category }),
            isActive: filters.category === category,
          })),
        ]}
      />
      {programs.length > 0 ? (
        <>
          <h2 className="sr-only">Programs</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={GraduationCapIcon}
          title="No programs to show"
          description="No programs are published in this category yet. Please check back soon."
        />
      )}
    </div>
  );
}
