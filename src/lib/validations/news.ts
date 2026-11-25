import { z } from "zod";

import { CONTENT_STATUSES, NEWS_TYPES } from "@/lib/constants/enums";
import {
  filterEnum,
  imageShape,
  isoDateText,
  listQuerySchema,
  requireImageAlt,
  shortText,
  sortParam,
} from "@/lib/validations/common";

const MAX_TITLE_LENGTH = 200;
const MAX_EXCERPT_LENGTH = 300;
const MAX_BODY_LENGTH = 20_000;
const MAX_VENUE_LENGTH = 200;
/** Search engines show about 60 characters of a title and 160 of a description. */
export const MAX_SEO_TITLE_LENGTH = 70;
export const MAX_SEO_DESCRIPTION_LENGTH = 160;

export const listNewsQuerySchema = listQuerySchema.extend({
  status: filterEnum(CONTENT_STATUSES),
  type: filterEnum(NEWS_TYPES),
  sort: sortParam(["title", "publishedAt", "updatedAt"], "-updatedAt"),
});

const optionalDay = z.union([z.literal(""), isoDateText]);

/** The whole news or event form. The body is plain text shown with `FormattedText`. */
export const newsFormSchema = z
  .object({
    title: shortText("Title", MAX_TITLE_LENGTH),
    type: z.enum(NEWS_TYPES, { error: "Choose news or event" }),
    excerpt: shortText("Excerpt", MAX_EXCERPT_LENGTH),
    body: shortText("Body", MAX_BODY_LENGTH),
    eventDate: optionalDay,
    /** Optional start time, "HH:mm" in Pakistan time, for events. */
    eventStartTime: z.union([
      z.literal(""),
      z.iso.time({ precision: -1, error: "Enter a valid time" }),
    ]),
    venue: z.string().trim().max(MAX_VENUE_LENGTH, "Keep the venue short"),
    status: z.enum(CONTENT_STATUSES, { error: "Choose a status" }),
    /** Empty means "when it is published". */
    publishedOn: optionalDay,
    seoTitle: z
      .string()
      .trim()
      .max(
        MAX_SEO_TITLE_LENGTH,
        `Keep the search title under ${String(MAX_SEO_TITLE_LENGTH)} characters`,
      ),
    seoDescription: z
      .string()
      .trim()
      .max(
        MAX_SEO_DESCRIPTION_LENGTH,
        `Keep the search description under ${String(MAX_SEO_DESCRIPTION_LENGTH)} characters`,
      ),
    ...imageShape,
  })
  .superRefine((value, context) => {
    requireImageAlt(value, context);
    if (value.type === "EVENT" && !value.eventDate) {
      context.addIssue({ code: "custom", path: ["eventDate"], message: "An event needs a date" });
    }
  });

export type ListNewsQuery = z.infer<typeof listNewsQuerySchema>;
export type NewsFormInput = z.infer<typeof newsFormSchema>;
export type NewsFormValues = z.input<typeof newsFormSchema>;
