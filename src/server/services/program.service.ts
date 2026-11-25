import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { ProgramFilters } from "@/lib/validations/list-params";
import {
  type ApplicationProgramOption,
  findPublishedProgramBySlug,
  listProgramOptions,
  listProgramsAcceptingApplications,
  listPublishedPrograms,
  type ProgramDetail,
  type ProgramSummary,
} from "@/server/repositories/program.repository";
import { toPublicImage, type PublicImage } from "@/server/services/image.service";

/** A published program for a card: its photo, when it has one, as a small public link. */
export type PublicProgramSummary = Omit<ProgramSummary, "image"> & { image: PublicImage | null };

/** Published programs, optionally of one category and limited to the first few (the home page). */
export async function getPrograms(
  filters: ProgramFilters,
  limit?: number,
): Promise<PublicProgramSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.programs);
  cacheLife("hours");
  const programs = await listPublishedPrograms(filters, limit);
  return programs.map((program) => ({ ...program, image: toPublicImage(program.image, 960) }));
}

/** A published program for its public page, with its image as a sized public link. */
export type PublicProgramDetail = Omit<ProgramDetail, "image"> & { image: PublicImage | null };

export async function getProgram(slug: string): Promise<PublicProgramDetail | null> {
  "use cache";
  // The detail lists institutions, so a change to either list refreshes it.
  cacheTag(CACHE_TAGS.programs, CACHE_TAGS.institutions);
  cacheLife("hours");
  const program = await findPublishedProgramBySlug(slug);
  return program ? { ...program, image: toPublicImage(program.image, 1600) } : null;
}

/** Programs the application form offers: published and accepting applications. */
export async function getApplicationPrograms(): Promise<ApplicationProgramOption[]> {
  "use cache";
  cacheTag(CACHE_TAGS.programs);
  cacheLife("hours");
  return listProgramsAcceptingApplications();
}

/** Every program for a staff filter. Staff data is never cached. */
export function getProgramOptions(): Promise<{ id: string; title: string }[]> {
  return listProgramOptions();
}
