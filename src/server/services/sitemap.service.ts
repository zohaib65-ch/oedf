import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { listSitemapRecords, type SitemapRecords } from "@/server/repositories/sitemap.repository";

/** Every public detail page, for sitemap.xml. */
export async function getSitemapRecords(): Promise<SitemapRecords> {
  "use cache";
  cacheTag(
    CACHE_TAGS.departments,
    CACHE_TAGS.programs,
    CACHE_TAGS.institutions,
    CACHE_TAGS.vacancies,
    CACHE_TAGS.publications,
    CACHE_TAGS.news,
  );
  cacheLife("hours");
  return listSitemapRecords();
}
