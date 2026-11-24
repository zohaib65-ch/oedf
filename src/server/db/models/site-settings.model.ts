import "server-only";
import { Schema } from "mongoose";

import { defineModel } from "@/server/db/define-model";

export const SITE_SETTINGS_KEY = "site";

const contactSchema = new Schema(
  {
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    officeHours: { type: String, default: "" },
  },
  { _id: false },
);

// Social icons stay hidden on the site until a link is added.
const socialLinksSchema = new Schema(
  {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    x: { type: String, default: "" },
    youtube: { type: String, default: "" },
  },
  { _id: false },
);

const impactNumberSchema = new Schema({
  label: { type: String, required: true },
  value: { type: Number, required: true, min: 0 },
});

const announcementSchema = new Schema(
  {
    isActive: { type: Boolean, default: false },
    text: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
  },
  { _id: false },
);

// The collection holds exactly one document. The fixed, unique key makes a second one impossible.
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: SITE_SETTINGS_KEY, immutable: true, unique: true },
    contact: { type: contactSchema, default: () => ({}) },
    mapUrl: { type: String, default: "" },
    social: { type: socialLinksSchema, default: () => ({}) },
    impactNumbers: { type: [impactNumberSchema], default: [] },
    announcement: { type: announcementSchema, default: () => ({}) },
    admissionsOpen: { type: Boolean, default: false },
    scholarshipsOpen: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "siteSettings" },
);

export const SiteSettingsModel = defineModel("SiteSettings", siteSettingsSchema);
