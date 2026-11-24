import { z } from "zod";

import { JOB_APPLICATION_STATUSES } from "@/lib/constants/enums";
import { filterEnum, listQuerySchema, objectIdText, sortParam } from "@/lib/validations/common";

const MAX_REASON_LENGTH = 1000;

export const listJobApplicationsQuerySchema = listQuerySchema.extend({
  vacancyId: objectIdText.optional().catch(undefined),
  status: filterEnum(JOB_APPLICATION_STATUSES),
  /** Archived applications are hidden unless this asks for them. */
  view: filterEnum(["ARCHIVED"]),
  sort: sortParam(["referenceNumber", "name", "status", "createdAt", "interviewAt"], "-createdAt"),
});

export const jobApplicationStatusChangeSchema = z.object({
  status: z.enum(JOB_APPLICATION_STATUSES, { error: "Choose a status" }),
  reason: z
    .string()
    .trim()
    .min(1, "Give a reason")
    .max(MAX_REASON_LENGTH, "Keep the reason under 1,000 characters"),
});

/** A date and time typed in Pakistan time, as a datetime-local input gives it (YYYY-MM-DDTHH:mm). */
const localDateTimeText = z.iso.datetime({ local: true, error: "Enter a valid date and time" });

/** Sets or clears the interview time (an empty value clears it). */
export const interviewFormSchema = z.object({
  interviewAt: z.union([z.literal(""), localDateTimeText]),
});

/** The PATCH body: the interview time, archiving, or both. */
export const jobApplicationUpdateSchema = z
  .object({
    interviewAt: interviewFormSchema.shape.interviewAt.optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((value) => value.interviewAt !== undefined || value.isArchived !== undefined, {
    error: "Nothing to change",
  });

export type ListJobApplicationsQuery = z.infer<typeof listJobApplicationsQuerySchema>;
export type JobApplicationStatusChangeInput = z.infer<typeof jobApplicationStatusChangeSchema>;
export type InterviewFormInput = z.infer<typeof interviewFormSchema>;
export type JobApplicationUpdateInput = z.infer<typeof jobApplicationUpdateSchema>;
