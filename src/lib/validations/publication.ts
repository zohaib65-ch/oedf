import { z } from "zod";

import { CONTENT_STATUSES, PUBLICATION_TYPES } from "@/lib/constants/enums";
import {
  filterEnum,
  imageShape,
  isoDateText,
  listQuerySchema,
  requireImageAlt,
  shortText,
  sortParam,
  optionalUploadSchema,
} from "@/lib/validations/common";

const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 10_000;
const MAX_LIST_ITEMS = 20;
const MAX_AUTHOR_LENGTH = 100;
export const MAX_TAG_LENGTH = 50;

export const listPublicationsQuerySchema = listQuerySchema.extend({
  status: filterEnum(CONTENT_STATUSES),
  type: filterEnum(PUBLICATION_TYPES),
  sort: sortParam(["title", "publishedOn", "updatedAt"], "-updatedAt"),
});

/**
 * A short list typed as text, one item per comma (the form), or sent as an array (other API
 * clients). Blank items and repeats are dropped.
 */
const textList = (label: string, maxLength: number) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((value) => {
      const items = (typeof value === "string" ? value.split(",") : value)
        .map((item) => item.trim())
        .filter(Boolean);
      return [...new Set(items)];
    })
    .pipe(
      // Checked on the whole list, not per item, so the message belongs to the field itself
      // (a per-item error lands on `tags.0`, which the form marks red but cannot show).
      z
        .array(z.string())
        .max(MAX_LIST_ITEMS, `List at most ${String(MAX_LIST_ITEMS)} ${label}s`)
        .refine(
          (items) => items.every((item) => item.length <= maxLength),
          `Keep each ${label} under ${String(maxLength)} characters. Separate ${label}s with commas.`,
        ),
    );

/** The whole publication form. The summary is plain text shown with `FormattedText`. */
export const publicationFormSchema = z
  .object({
    title: shortText("Title", MAX_TITLE_LENGTH),
    type: z.enum(PUBLICATION_TYPES, { error: "Choose a type" }),
    summary: shortText("Summary", MAX_SUMMARY_LENGTH),
    authors: textList("author", MAX_AUTHOR_LENGTH),
    tags: textList("topic", MAX_TAG_LENGTH),
    /** Empty means "the day it is published". */
    publishedOn: z.union([z.literal(""), isoDateText]),
    pdf: optionalUploadSchema,
    status: z.enum(CONTENT_STATUSES, { error: "Choose a status" }),
    ...imageShape,
  })
  .superRefine(requireImageAlt);

export type ListPublicationsQuery = z.infer<typeof listPublicationsQuerySchema>;
export type PublicationFormInput = z.infer<typeof publicationFormSchema>;
export type PublicationFormValues = z.input<typeof publicationFormSchema>;
