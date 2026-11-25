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
import { toPublicImage, type PublicImage } from "@/server/services/image.service";

/** A public institution for a card: its photo, when it has one, as a small public link. */
export type PublicInstitutionSummary = Omit<InstitutionSummary, "image"> & {
  image: PublicImage | null;
};

export async function getInstitutions(
  filters: InstitutionFilters,
  limit?: number,
): Promise<PublicInstitutionSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions);
  cacheLife("hours");
  const institutions = await listPublicInstitutions(filters, limit);
  return institutions.map((institution) => ({
    ...institution,
    image: toPublicImage(institution.image, 960),
  }));
}

export async function getInstitutionCities(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions);
  cacheLife("hours");
  return listPublicInstitutionCities();
}

/** A public institution for its page, with its image as a sized public link. */
export type PublicInstitutionDetail = Omit<InstitutionDetail, "image"> & {
  image: PublicImage | null;
};

export async function getInstitution(slug: string): Promise<PublicInstitutionDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.institutions, CACHE_TAGS.programs);
  cacheLife("hours");
  const institution = await findPublicInstitutionBySlug(slug);
  return institution ? { ...institution, image: toPublicImage(institution.image, 1600) } : null;
}
