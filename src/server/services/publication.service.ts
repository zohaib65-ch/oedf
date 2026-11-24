import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { PublicationFilters } from "@/lib/validations/list-params";
import {
  findPublishedPublicationBySlug,
  listLatestPublications,
  listPublicationYears,
  listPublishedPublications,
  type PublicationDetail,
  type PublicationPage,
  type PublicationSummary,
} from "@/server/repositories/publication.repository";

export async function getPublications(filters: PublicationFilters): Promise<PublicationPage> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return listPublishedPublications(filters);
}

export async function getLatestPublications(limit: number): Promise<PublicationSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return listLatestPublications(limit);
}

export async function getPublicationYears(): Promise<number[]> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return listPublicationYears();
}

export async function getPublication(slug: string): Promise<PublicationDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return findPublishedPublicationBySlug(slug);
}
