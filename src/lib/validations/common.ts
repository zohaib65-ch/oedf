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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_QUERY_LENGTH = 100;

/** A 24-character hexadecimal ID, as MongoDB and Better Auth store them. */
export const objectIdText = z.string().regex(/^[0-9a-f]{24}$/, "Choose a valid option");

const MAX_PAGE = 10_000;

/**
 * The paging and search every portal list accepts: `page`, `pageSize` (at most 100) and `q`. A bad
 * value falls back to the default instead of failing, so an edited or old link still opens.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
  q: z
    .string()
    .trim()
    .max(MAX_QUERY_LENGTH)
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
});

/** The "All" choice of a filter select. It means no filter and never reaches a query. */
export const ALL_FILTER_VALUE = "ALL";

/** A filter picked from a fixed list. "All", an empty value or an unknown value mean no filter. */
export const filterEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .preprocess(
      (value) => (value === ALL_FILTER_VALUE || value === "" ? undefined : value),
      z.enum(values).optional(),
    )
    .catch(undefined);

/** A filter that is free text, such as a city. Empty means no filter. */
export const filterText = z
  .string()
  .trim()
  .max(MAX_QUERY_LENGTH)
  .transform((value) => value || undefined)
  .optional()
  .catch(undefined);

/** A day typed in a date filter (YYYY-MM-DD). Anything else means no filter. */
export const filterDate = z.iso.date().optional().catch(undefined);

/** `field` sorts ascending, `-field` descending. */
export type SortValue<T extends string> = T | `-${T}`;

/**
 * The `sort` parameter of a list: one of the given fields, optionally with a leading minus for
 * newest or largest first. Anything else falls back to the list's default order.
 */
export function sortParam<const T extends string>(fields: readonly T[], fallback: SortValue<T>) {
  const allowed = new Set<string>(fields.flatMap((field) => [field, `-${field}`]));
  return z
    .unknown()
    .optional()
    .transform((value): SortValue<T> =>
      typeof value === "string" && allowed.has(value) ? (value as SortValue<T>) : fallback,
    );
}

/** Splits a sort value into its field and direction. */
export function parseSort<T extends string>(
  sort: SortValue<T>,
): { field: T; direction: "asc" | "desc" } {
  return sort.startsWith("-")
    ? { field: sort.slice(1) as T, direction: "desc" }
    : { field: sort as T, direction: "asc" };
}

const MAX_NOTE_LENGTH = 2000;

/** An internal note or progress update on any record's timeline. */
export const noteInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a note")
    .max(MAX_NOTE_LENGTH, "Keep the note under 2,000 characters"),
});
