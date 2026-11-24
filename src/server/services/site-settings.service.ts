import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import {
  findPublicSiteSettings,
  type PublicSiteSettingsRecord,
} from "@/server/repositories/site-settings.repository";

/** Settings shown in the public header and footer. Cached until the settings are saved. */
export async function getPublicSiteSettings(): Promise<PublicSiteSettingsRecord | null> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("hours");
  return findPublicSiteSettings();
}
