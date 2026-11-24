import { z } from "zod";

import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  AWARD_PERIODS,
  AWARD_STATUSES,
} from "@/lib/constants/enums";
import {
  filterDate,
  filterEnum,
  filterText,
  isoDateText,
  listQuerySchema,
  objectIdText,
  sortParam,
} from "@/lib/validations/common";

const MAX_REASON_LENGTH = 1000;
const MAX_MISSING_ITEMS = 20;
const MAX_ITEM_LENGTH = 200;
// A ceiling against typing mistakes: no single payment period should come near ten million rupees.
const MAX_AWARD_PKR = 10_000_000;

const APPLICATION_SORT_FIELDS = ["referenceNumber", "name", "status", "createdAt"] as const;

export const listApplicationsQuerySchema = listQuerySchema.extend({
  type: filterEnum(APPLICATION_TYPES),
  status: filterEnum(APPLICATION_STATUSES),
  programId: objectIdText.optional().catch(undefined),
  city: filterText,
  from: filterDate,
  to: filterDate,
  /** Archived applications are hidden unless this asks for them. */
  view: filterEnum(["ARCHIVED"]),
  sort: sortParam(APPLICATION_SORT_FIELDS, "-createdAt"),
});

/** Archives an application (it is never deleted), or restores it. */
export const applicationUpdateSchema = z.object({ isArchived: z.boolean() });

export const checklistSchema = z.object({
  identity: z.boolean(),
  education: z.boolean(),
  eligibility: z.boolean(),
  documents: z.boolean(),
});

/** The items of a list typed one per line. Empty lines are dropped. */
export function splitLines(text: string | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** A list typed one item per line. It stays text here, so a form and the API share the schema. */
const linesText = z
  .string()
  .max(MAX_MISSING_ITEMS * MAX_ITEM_LENGTH)
  .optional()
  .refine(
    (value) => splitLines(value).length <= MAX_MISSING_ITEMS,
    `List at most ${MAX_MISSING_ITEMS} items`,
  )
  .refine(
    (value) => splitLines(value).every((item) => item.length <= MAX_ITEM_LENGTH),
    `Keep each item under ${MAX_ITEM_LENGTH} characters`,
  );

/** A day that may be left empty (""), which means "not set". */
const optionalDateText = z.union([z.literal(""), isoDateText]).optional();

/** The fields of an award, without the cross-field rule, so forms and updates can reuse them. */
const awardFields = {
  amountPkr: z.coerce
    .number({ error: "Enter the amount in rupees" })
    .int("Use whole rupees")
    .positive("Enter an amount above zero")
    .max(MAX_AWARD_PKR, "This amount is too large"),
  period: z.enum(AWARD_PERIODS, { error: "Choose a period" }),
  startDate: isoDateText,
  renewalDate: optionalDateText,
};

const renewalAfterStart = (value: { startDate: string; renewalDate?: string | undefined }) =>
  !value.renewalDate || value.renewalDate > value.startDate;
const RENEWAL_RULE = {
  path: ["renewalDate"],
  error: "The renewal date must be after the start date",
};

/** What is decided when a scholarship is approved: amount, period and dates. */
const awardTermsSchema = z.object(awardFields).refine(renewalAfterStart, RENEWAL_RULE);

export const applicationStatusChangeSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES),
    reason: z
      .string()
      .trim()
      .min(1, "Give a reason")
      .max(MAX_REASON_LENGTH, "Keep the reason under 1,000 characters"),
    /** Only for Incomplete: what the applicant must send, one per line. */
    missingItems: linesText,
    /** Only when approving a scholarship. */
    award: awardTermsSchema.optional(),
  })
  .refine((value) => value.status !== "INCOMPLETE" || splitLines(value.missingItems).length > 0, {
    path: ["missingItems"],
    error: "List what the applicant must send",
  });

const AWARD_SORT_FIELDS = ["studentName", "amountPkr", "startDate", "renewalDate"] as const;

export const listAwardsQuerySchema = listQuerySchema.extend({
  status: filterEnum(AWARD_STATUSES),
  /** Awards whose renewal falls on or before this day. */
  renewalBefore: filterDate,
  sort: sortParam(AWARD_SORT_FIELDS, "renewalDate"),
});

/** Every editable field of an award, as the edit form sends them. */
export const awardFormSchema = z
  .object({ ...awardFields, status: z.enum(AWARD_STATUSES, { error: "Choose a status" }) })
  .refine(renewalAfterStart, RENEWAL_RULE);

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type ChecklistInput = z.infer<typeof checklistSchema>;
export type ApplicationStatusChangeInput = z.infer<typeof applicationStatusChangeSchema>;
export type ApplicationStatusChangeFormValues = z.input<typeof applicationStatusChangeSchema>;
export type ListAwardsQuery = z.infer<typeof listAwardsQuerySchema>;
export type AwardFormInput = z.infer<typeof awardFormSchema>;
export type AwardFormValues = z.input<typeof awardFormSchema>;
