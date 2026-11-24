import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { VacancyFilters } from "@/lib/validations/list-params";
import {
  findPublishedVacancyBySlug,
  listOpenVacancies,
  listOpenVacancyCities,
  type VacancyDetail,
  type VacancySummary,
} from "@/server/repositories/vacancy.repository";

// Vacancies close on a deadline without anyone saving anything, so they are cached for minutes.

export async function getOpenVacancies(filters: VacancyFilters): Promise<VacancySummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.vacancies, CACHE_TAGS.departments);
  cacheLife("minutes");
  return listOpenVacancies(filters);
}

export async function getOpenVacancyCities(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.vacancies);
  cacheLife("minutes");
  return listOpenVacancyCities();
}

export async function getVacancy(slug: string): Promise<VacancyDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.vacancies, CACHE_TAGS.departments);
  cacheLife("minutes");
  return findPublishedVacancyBySlug(slug);
}
