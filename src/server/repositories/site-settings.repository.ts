import "server-only";

import { connectDb } from "@/server/db/connection";
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

export interface PublicSiteSettingsRecord {
  contact: { address: string; phone: string; email: string; officeHours: string };
  social: { facebook: string; instagram: string; linkedin: string; x: string; youtube: string };
  announcement: { isActive: boolean; text: string; linkUrl: string };
}

/** The settings the public layout shows, or null before the settings document exists. */
export async function findPublicSiteSettings(): Promise<PublicSiteSettingsRecord | null> {
  await connectDb();
  const settings = await SiteSettingsModel.findOne(
    { key: SITE_SETTINGS_KEY },
    { contact: 1, social: 1, announcement: 1 },
  ).lean();
  if (!settings) {
    return null;
  }
  return {
    contact: {
      address: settings.contact.address,
      phone: settings.contact.phone,
      email: settings.contact.email,
      officeHours: settings.contact.officeHours,
    },
    social: {
      facebook: settings.social.facebook,
      instagram: settings.social.instagram,
      linkedin: settings.social.linkedin,
      x: settings.social.x,
      youtube: settings.social.youtube,
    },
    announcement: {
      isActive: settings.announcement.isActive,
      text: settings.announcement.text,
      linkUrl: settings.announcement.linkUrl,
    },
  };
}
