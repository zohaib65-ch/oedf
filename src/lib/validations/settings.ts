import { z } from "zod";

import { emailText, nameText, phoneText } from "@/lib/validations/common";

const MAX_IMPACT_NUMBERS = 8;
const MAX_VALUE = 1_000_000_000;
const MAX_LINE = 200;
const MAX_TEXT = 500;

/** A web address, or empty when the link is not set. */
const optionalUrl = z
  .string()
  .trim()
  .max(MAX_TEXT)
  .refine((value) => value === "" || /^https?:\/\//.test(value), "Start with http:// or https://")
  .refine((value) => value === "" || URL.canParse(value), "Enter a valid web address");

const optionalEmail = z.union([z.literal(""), emailText]);
const optionalPhone = z.union([z.literal(""), phoneText]);
const optionalText = (max: number) => z.string().trim().max(max, "This is too long");

export const updateSettingsSchema = z.object({
  contact: z.object({
    address: optionalText(MAX_TEXT),
    phone: optionalPhone,
    email: optionalEmail,
    officeHours: optionalText(MAX_LINE),
  }),
  mapUrl: optionalUrl,
  social: z.object({
    facebook: optionalUrl,
    instagram: optionalUrl,
    linkedin: optionalUrl,
    x: optionalUrl,
    youtube: optionalUrl,
  }),
  impactNumbers: z
    .array(
      z.object({
        label: nameText("Label"),
        value: z.coerce.number().int("Use a whole number").min(0).max(MAX_VALUE),
      }),
    )
    .max(MAX_IMPACT_NUMBERS, `Add at most ${MAX_IMPACT_NUMBERS} figures`),
  announcement: z.object({
    isActive: z.boolean(),
    text: optionalText(MAX_LINE),
    linkUrl: z
      .string()
      .trim()
      .max(MAX_TEXT)
      .refine(
        (value) => value === "" || value.startsWith("/") || URL.canParse(value),
        "Enter a valid link",
      ),
  }),
  admissionsOpen: z.boolean(),
  scholarshipsOpen: z.boolean(),
});

export const departmentFieldsSchema = z.object({
  directorName: optionalText(MAX_LINE),
  notificationEmail: optionalEmail,
});

export const updateDepartmentSchema = departmentFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change");

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateSettingsFormValues = z.input<typeof updateSettingsSchema>;
export type DepartmentFields = z.infer<typeof departmentFieldsSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
