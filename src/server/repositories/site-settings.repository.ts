import "server-only";

import { SITE_SETTINGS_KEY, SiteSettingsModel } from "@/server/db/models/site-settings.model";

type SettingsDefaults = Parameters<typeof SiteSettingsModel.create>[0];

/** Creates the single settings document if it is missing. Returns true when it was created. */
export async function ensureSiteSettings(defaults: SettingsDefaults): Promise<boolean> {
  const result = await SiteSettingsModel.updateOne(
    { key: SITE_SETTINGS_KEY },
    { $setOnInsert: defaults },
    { upsert: true },
  );
  return result.upsertedCount > 0;
}
