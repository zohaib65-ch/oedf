import { z } from "zod";

import { RESOURCE_TYPES } from "@/lib/constants/uploads";

const MAX_NAME_LENGTH = 100;
const MAX_LINE_LENGTH = 200;
const MAX_TEXT_LENGTH = 2000;
const CNIC_DIGITS = 13;
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/** Trimmed text of a sensible length. */
export const shortText = (label: string, max = MAX_LINE_LENGTH) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const nameText = (label: string) => shortText(label, MAX_NAME_LENGTH);

export const longText = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(MAX_TEXT_LENGTH, `${label} is too long`);

export const emailText = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/** A phone number: digits with an optional leading plus, spaces and dashes. */
export const phoneText = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]+$/, "Enter a valid phone number")
  .refine((value) => {
    const digits = value.replaceAll(/\D/g, "").length;
    return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
  }, "Enter a valid phone number");

/** A CNIC or B-Form number: 13 digits, with or without dashes. Stored without dashes. */
export const cnicText = z
  .string()
  .trim()
  .regex(/^\d{5}-?\d{7}-?\d$/, "Enter the 13 digits of the CNIC or B-Form number")
  .transform((value) => value.replaceAll("-", ""))
  .refine((value) => value.length === CNIC_DIGITS);

/** A date typed as YYYY-MM-DD, which is what a date input gives. */
export const isoDateText = z.iso.date("Enter a valid date");

/** A file that was uploaded to Cloudinary and is waiting to be confirmed by the server. */
export const uploadedFileSchema = z.object(
  {
    publicId: z.string().min(1).max(300),
    resourceType: z.enum(RESOURCE_TYPES),
    originalName: z.string().trim().min(1).max(255),
  },
  "Upload this file",
);

export type UploadedFile = z.infer<typeof uploadedFileSchema>;

/**
 * Fields every public form carries: the spam-check token and a honeypot. Real visitors never see
 * the honeypot, so a filled one means a bot.
 */
export const spamProtectionShape = {
  turnstileToken: z.string().max(2048).optional(),
  faxNumber: z.string().max(200).optional(),
};
