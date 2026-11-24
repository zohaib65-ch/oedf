import { z } from "zod";

import { EMPLOYMENT_TYPES, VACANCY_STATUSES } from "@/lib/constants/enums";
import {
  filterEnum,
  isoDateText,
  listQuerySchema,
  objectIdText,
  shortText,
  sortParam,
} from "@/lib/validations/common";

const MAX_TITLE_LENGTH = 150;
const MAX_CITY_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_REQUIREMENTS_LENGTH = 5000;

export const listVacanciesQuerySchema = listQuerySchema.extend({
  /** Draft, Published (open) or Closed, where Closed includes published vacancies past their deadline. */
  status: filterEnum(VACANCY_STATUSES),
  departmentId: objectIdText.optional().catch(undefined),
  type: filterEnum(EMPLOYMENT_TYPES),
  sort: sortParam(["title", "deadline", "createdAt"], "-createdAt"),
});

/** The vacancy form. Description and requirements are plain text, shown with `FormattedText`. */
export const vacancyFormSchema = z.object({
  title: shortText("Title", MAX_TITLE_LENGTH),
  departmentId: z.string().regex(/^[0-9a-f]{24}$/, "Choose an office"),
  city: shortText("City", MAX_CITY_LENGTH),
  employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Choose the type of post" }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(MAX_DESCRIPTION_LENGTH, "The description is too long"),
  requirements: z.string().trim().max(MAX_REQUIREMENTS_LENGTH, "The requirements are too long"),
  /** The last day to apply. Applications are accepted until the end of that day, Pakistan time. */
  deadline: isoDateText,
});

export const vacancyStatusChangeSchema = z.object({
  status: z.enum(["PUBLISHED", "CLOSED"], { error: "Choose publish or close" }),
});

export type ListVacanciesQuery = z.infer<typeof listVacanciesQuerySchema>;
export type VacancyFormInput = z.infer<typeof vacancyFormSchema>;
export type VacancyStatusChangeInput = z.infer<typeof vacancyStatusChangeSchema>;
