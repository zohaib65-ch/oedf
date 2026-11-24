import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { InstitutionFilters } from "@/lib/validations/list-params";
import {
  findPublicInstitutionBySlug,
  listPublicInstitutionCities,
  listPublicInstitutions,
  type InstitutionDetail,
  type InstitutionSummary,
} from "@/server/repositories/institution.repository";

export async function getInstitutions(
  filters: InstitutionFilters,
  limit?: number,
): Promise<InstitutionSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions);
  cacheLife("hours");
  return listPublicInstitutions(filters, limit);
}

export async function getInstitutionCities(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions);
  cacheLife("hours");
  return listPublicInstitutionCities();
}

export async function getInstitution(slug: string): Promise<InstitutionDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions, CACHE_TAGS.programs);
  cacheLife("hours");
  return findPublicInstitutionBySlug(slug);
}
