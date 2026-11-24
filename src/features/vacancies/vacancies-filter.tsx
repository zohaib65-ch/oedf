import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { EMPLOYMENT_TYPE_LABELS, toOptions, VACANCY_STATUS_LABELS } from "@/lib/constants/labels";
import type { ListVacanciesQuery } from "@/lib/validations/vacancy";

interface VacanciesFilterProps {
  query: ListVacanciesQuery;
  offices: readonly { value: string; label: string }[];
}

export function VacanciesFilter({ query, offices }: VacanciesFilterProps) {
  const resetKey = [query.q, query.status, query.departmentId, query.type].join("|");
  return (
    <FilterBar
      basePath="/portal/vacancies"
      label="Filter vacancies"
      resetKey={resetKey}
      sort={query.sort}
    >
      <FilterInput
        id="vacancies-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Title or city"
        className="w-56"
      />
      <FilterSelect
        id="vacancies-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(VACANCY_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-40"
      />
      <FilterSelect
        id="vacancies-office"
        name="departmentId"
        label="Office"
        value={query.departmentId}
        options={offices}
        allLabel="All offices"
        className="w-64"
      />
      <FilterSelect
        id="vacancies-type"
        name="type"
        label="Type"
        value={query.type}
        options={toOptions(EMPLOYMENT_TYPE_LABELS)}
        allLabel="All types"
        className="w-40"
      />
    </FilterBar>
  );
}
