import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { PublicationFilters } from "@/lib/validations/list-params";
import {
  findPublishedPdfBySlug,
  findPublishedPublicationBySlug,
  listLatestPublications,
  listPublicationYears,
  listPublishedPublications,
  type PublicationDetail,
  type PublicationSummary,
} from "@/server/repositories/publication.repository";
import { toPublicImage, type PublicImage } from "@/server/services/image.service";
import { createPrivateDownloadUrl } from "@/server/storage/cloudinary";

/** A published publication for a card: its cover, when it has one, as a sized public link. */
export type PublicPublicationSummary = Omit<PublicationSummary, "cover"> & {
  image: PublicImage | null;
};

function toPublicSummary({ cover, ...publication }: PublicationSummary): PublicPublicationSummary {
  return { ...publication, image: toPublicImage(cover, 960) };
}

export async function getPublications(
  filters: PublicationFilters,
): Promise<{ items: PublicPublicationSummary[]; total: number }> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  const { items, total } = await listPublishedPublications(filters);
  return { items: items.map(toPublicSummary), total };
}

export async function getLatestPublications(limit: number): Promise<PublicPublicationSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return (await listLatestPublications(limit)).map(toPublicSummary);
}

export async function getPublicationYears(): Promise<number[]> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  return listPublicationYears();
}

/** A published publication for its public page, with its cover as a wide public link. */
export type PublicPublicationDetail = Omit<PublicationDetail, "cover"> & {
  image: PublicImage | null;
};

export async function getPublication(slug: string): Promise<PublicPublicationDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.publications);
  cacheLife("hours");
  const publication = await findPublishedPublicationBySlug(slug);
  if (!publication) {
    return null;
  }
  const { cover, ...rest } = publication;
  return { ...rest, image: toPublicImage(cover, 1600) };
}

/**
 * A 5-minute link to a published publication's PDF, or null. The file is private on Cloudinary, so
 * unpublishing or deleting a publication stops new downloads at once. Never cached: each link expires.
 */
export async function getPublicationPdfUrl(slug: string): Promise<string | null> {
  const file = await findPublishedPdfBySlug(slug);
  return file ? createPrivateDownloadUrl(file) : null;
}
