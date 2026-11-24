import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { NewsFilters } from "@/lib/validations/list-params";
import {
  findPublishedNewsBySlug,
  listLatestNews,
  listPublishedNews,
  type NewsDetail,
  type NewsPage,
  type NewsSummary,
} from "@/server/repositories/news.repository";

export async function getNews(filters: NewsFilters): Promise<NewsPage> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  return listPublishedNews(filters);
}

export async function getLatestNews(limit: number): Promise<NewsSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  return listLatestNews(limit);
}

export async function getNewsPost(slug: string): Promise<NewsDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.news);
  cacheLife("hours");
  return findPublishedNewsBySlug(slug);
}
