import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { SETTINGS_CACHE_TAG } from "@/lib/constants/site";
import {
  findPublicSiteSettings,
  type PublicSiteSettingsRecord,
} from "@/server/repositories/site-settings.repository";

/** Settings shown in the public header and footer. Cached until the settings are saved. */
export async function getPublicSiteSettings(): Promise<PublicSiteSettingsRecord | null> {
  "use cache";
  cacheTag(SETTINGS_CACHE_TAG);
  cacheLife("hours");
  return findPublicSiteSettings();
}
