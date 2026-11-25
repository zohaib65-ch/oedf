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
  contact: { address: string; email: string; officeHours: string };
  social: { facebook: string; instagram: string; linkedin: string; x: string; youtube: string };
  announcement: { isActive: boolean; text: string; linkUrl: string };
  mapUrl: string;
  impactNumbers: { label: string; value: number }[];
  admissionsOpen: boolean;
  scholarshipsOpen: boolean;
}

/** The settings the public site shows, or null before the settings document exists. */
export async function findPublicSiteSettings(): Promise<PublicSiteSettingsRecord | null> {
  await connectDb();
  const settings = await SiteSettingsModel.findOne(
    { key: SITE_SETTINGS_KEY },
    {
      contact: 1,
      social: 1,
      announcement: 1,
      mapUrl: 1,
      impactNumbers: 1,
      admissionsOpen: 1,
      scholarshipsOpen: 1,
    },
  ).lean();
  if (!settings) {
    return null;
  }
  return {
    contact: {
      address: settings.contact.address,
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
    mapUrl: settings.mapUrl,
    impactNumbers: settings.impactNumbers.map(({ label, value }) => ({ label, value })),
    admissionsOpen: settings.admissionsOpen,
    scholarshipsOpen: settings.scholarshipsOpen,
  };
}

/** Replaces the editable settings and returns which sections changed, for the audit log. */
export async function saveSiteSettings(next: PublicSiteSettingsRecord): Promise<string[]> {
  await connectDb();
  const before = await findPublicSiteSettings();
  await SiteSettingsModel.updateOne({ key: SITE_SETTINGS_KEY }, { $set: next }, { upsert: true });
  if (!before) {
    return Object.keys(next);
  }
  return (Object.keys(next) as (keyof PublicSiteSettingsRecord)[]).filter(
    (section) => JSON.stringify(before[section]) !== JSON.stringify(next[section]),
  );
}
