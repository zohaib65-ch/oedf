import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { ProgramFilters } from "@/lib/validations/list-params";
import {
  findPublishedProgramBySlug,
  listProgramsAcceptingApplications,
  listPublishedPrograms,
  type ApplicationProgramOption,
  type ProgramDetail,
  type ProgramSummary,
} from "@/server/repositories/program.repository";

/** Published programs, optionally of one category and limited to the first few (the home page). */
export async function getPrograms(
  filters: ProgramFilters,
  limit?: number,
): Promise<ProgramSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.programs);
  cacheLife("hours");
  return listPublishedPrograms(filters, limit);
}

export async function getProgram(slug: string): Promise<ProgramDetail | null> {
  "use cache";
  // The detail lists institutions, so a change to either list refreshes it.
  cacheTag(CACHE_TAGS.programs, CACHE_TAGS.institutions);
  cacheLife("hours");
  return findPublishedProgramBySlug(slug);
}

/** Programs the application form offers: published and accepting applications. */
export async function getApplicationPrograms(): Promise<ApplicationProgramOption[]> {
  "use cache";
  cacheTag(CACHE_TAGS.programs);
  cacheLife("hours");
  return listProgramsAcceptingApplications();
}
