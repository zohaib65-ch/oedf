import { z } from "zod";

import { AGREEMENT_STATUSES, INSTITUTION_STATUSES, INSTITUTION_TYPES } from "@/lib/constants/enums";
import {
  filterEnum,
  imageShape,
  isoDateText,
  listQuerySchema,
  requireImageAlt,
  shortText,
  sortParam,
  uploadedFileSchema,
} from "@/lib/validations/common";

const MAX_NAME_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_RATING = 5;

export const listInstitutionsQuerySchema = listQuerySchema.extend({
  status: filterEnum(INSTITUTION_STATUSES),
  type: filterEnum(INSTITUTION_TYPES),
  sort: sortParam(["name", "city", "updatedAt"], "name"),
});

/** The institution form. Shown on the public site only when Active and public. */
export const institutionFormSchema = z
  .object({
    name: shortText("Name", MAX_NAME_LENGTH),
    type: z.enum(INSTITUTION_TYPES, { error: "Choose a type" }),
    city: shortText("City", 80),
    address: z.string().trim().max(300, "The address is too long"),
    description: z.string().trim().max(MAX_DESCRIPTION_LENGTH, "The description is too long"),
    status: z.enum(INSTITUTION_STATUSES, { error: "Choose a status" }),
    isPublic: z.boolean(),
    ...imageShape,
  })
  .superRefine(requireImageAlt);

const optionalDay = z.union([z.literal(""), isoDateText]);

/** An agreement with a partner. The signed copy is an optional private PDF. */
export const agreementFormSchema = z
  .object({
    title: shortText("Title", MAX_NAME_LENGTH),
    partner: shortText("Partner", MAX_NAME_LENGTH),
    startDate: isoDateText,
    endDate: optionalDay,
    renewalDate: optionalDay,
    status: z.enum(AGREEMENT_STATUSES, { error: "Choose a status" }),
    document: uploadedFileSchema.optional(),
  })
  .superRefine((value, context) => {
    for (const field of ["endDate", "renewalDate"] as const) {
      if (value[field] && value[field] < value.startDate) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Pick a date on or after the start date",
        });
      }
    }
  });

/** A performance review: a date, a rating from 1 to 5 and a written summary. */
export const reviewFormSchema = z.object({
  reviewDate: isoDateText,
  rating: z.coerce
    .number({ error: "Choose a rating" })
    .int()
    .min(1, "Choose a rating")
    .max(MAX_RATING, "Choose a rating"),
  summary: shortText("Summary", MAX_SUMMARY_LENGTH),
});

export type ListInstitutionsQuery = z.infer<typeof listInstitutionsQuerySchema>;
export type InstitutionFormInput = z.infer<typeof institutionFormSchema>;
export type InstitutionFormValues = z.input<typeof institutionFormSchema>;
export type AgreementFormInput = z.infer<typeof agreementFormSchema>;
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;
export type ReviewFormValues = z.input<typeof reviewFormSchema>;
