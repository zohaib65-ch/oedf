import { z } from "zod";

import { CONTENT_STATUSES, PROGRAM_CATEGORIES } from "@/lib/constants/enums";
import {
  filterEnum,
  imageShape,
  listQuerySchema,
  objectIdText,
  requireImageAlt,
  shortText,
  sortParam,
} from "@/lib/validations/common";

const MAX_TITLE_LENGTH = 150;
const MAX_SUMMARY_LENGTH = 300;
const MAX_LONG_TEXT = 10_000;
const MAX_INSTITUTIONS = 50;

export const listProgramsQuerySchema = listQuerySchema.extend({
  status: filterEnum(CONTENT_STATUSES),
  category: filterEnum(PROGRAM_CATEGORIES),
  sort: sortParam(["title", "updatedAt"], "title"),
});

const longText = (message: string) => z.string().trim().max(MAX_LONG_TEXT, message);

/** The whole program form. Long text is plain text shown with `FormattedText`. */
export const programFormSchema = z
  .object({
    title: shortText("Title", MAX_TITLE_LENGTH),
    category: z.enum(PROGRAM_CATEGORIES, { error: "Choose a category" }),
    summary: shortText("Summary", MAX_SUMMARY_LENGTH),
    description: longText("The description is too long"),
    duration: z.string().trim().max(100, "Keep the duration short"),
    eligibility: longText("The eligibility text is too long"),
    institutionIds: z.array(objectIdText).max(MAX_INSTITUTIONS, "Choose fewer institutions"),
    acceptsApplications: z.boolean(),
    status: z.enum(CONTENT_STATUSES, { error: "Choose a status" }),
    ...imageShape,
  })
  .superRefine(requireImageAlt);

export type ListProgramsQuery = z.infer<typeof listProgramsQuerySchema>;
export type ProgramFormInput = z.infer<typeof programFormSchema>;
export type ProgramFormValues = z.input<typeof programFormSchema>;
