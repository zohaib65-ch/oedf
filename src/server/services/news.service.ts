import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { NewsFilters } from "@/lib/validations/list-params";
import {
  findPublishedNewsBySlug,
  listLatestNews,
  listPublishedNews,
  type NewsDetail,
  type NewsSummary,
} from "@/server/repositories/news.repository";
import { toPublicImage, type PublicImage } from "@/server/services/image.service";

/** A published post for a card: its cover, when it has one, as a sized public link. */
export type PublicNewsSummary = Omit<NewsSummary, "cover"> & { image: PublicImage | null };

function toPublicSummary({ cover, ...post }: NewsSummary): PublicNewsSummary {
  return { ...post, image: toPublicImage(cover, 960) };
}

export async function getNews(
  filters: NewsFilters,
): Promise<{ items: PublicNewsSummary[]; total: number }> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  const { items, total } = await listPublishedNews(filters);
  return { items: items.map(toPublicSummary), total };
}

export async function getLatestNews(limit: number): Promise<PublicNewsSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  return (await listLatestNews(limit)).map(toPublicSummary);
}

/** A published post for its page, with its cover as a wide public link. */
export type PublicNewsDetail = Omit<NewsDetail, "cover"> & { image: PublicImage | null };

export async function getNewsPost(slug: string): Promise<PublicNewsDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  const post = await findPublishedNewsBySlug(slug);
  if (!post) {
    return null;
  }
  const { cover, ...rest } = post;
  return { ...rest, image: toPublicImage(cover, 1600) };
}
