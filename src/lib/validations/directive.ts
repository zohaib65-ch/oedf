import { z } from "zod";

import {
  ASSIGNMENT_STATUSES,
  CLARIFICATION_DECISIONS,
  CLARIFICATION_REASONS,
  DIRECTIVE_PRIORITIES,
} from "@/lib/constants/enums";
import {
  filterEnum,
  isoDateText,
  listQuerySchema,
  noteInputSchema,
  objectIdText,
  shortText,
  sortParam,
} from "@/lib/validations/common";

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 10_000;
const MAX_REASON_LENGTH = 2000;
/** Every office except the issuing one could be a target; five offices exist. */
const MAX_TARGET_OFFICES = 5;

export const listDirectivesQuerySchema = listQuerySchema.extend({
  status: filterEnum(ASSIGNMENT_STATUSES),
  priority: filterEnum(DIRECTIVE_PRIORITIES),
  /** `OVERDUE` shows only directives past their due date that are not finished. */
  show: filterEnum(["OVERDUE"]),
  sort: sortParam(["dueDate", "issuedAt"], "dueDate"),
});

/** A new directive from the Research & Policy Institute. */
export const issueDirectiveSchema = z.object({
  title: shortText("Title", MAX_TITLE_LENGTH),
  body: shortText("Instructions", MAX_BODY_LENGTH),
  departmentIds: z
    .array(objectIdText)
    .min(1, "Choose at least one office")
    .max(MAX_TARGET_OFFICES, "Choose fewer offices"),
  dueDate: isoDateText,
  priority: z.enum(DIRECTIVE_PRIORITIES, { error: "Choose a priority" }),
});

const reasonText = (message: string) =>
  z.string().trim().min(1, message).max(MAX_REASON_LENGTH, "Keep this under 2,000 characters");

const noteText = z.string().trim().max(MAX_REASON_LENGTH, "Keep the note under 2,000 characters");

/**
 * A change to one office's assignment: its Director names an owner, or the office starts or
 * completes the work. A note explains the move and is kept in the history.
 */
export const updateAssignmentSchema = z
  .object({
    ownerId: objectIdText.optional(),
    status: z.enum(["IN_PROGRESS", "COMPLETED"]).optional(),
    note: noteText,
  })
  .refine((value) => value.ownerId !== undefined || value.status !== undefined, {
    error: "Choose an owner or a new status",
    path: ["ownerId"],
  });

/** The owner dialog's fields. The dialog sends them as an assignment update. */
export const ownerChoiceSchema = z.object({
  ownerId: objectIdText.or(z.literal("")).refine(Boolean, "Choose a person"),
  note: noteText,
});

/** The start and complete dialogs' field. The status comes from the button. */
export const progressNoteSchema = z.object({ note: noteText });

/** A progress update on one office's assignment. */
export const directiveNoteSchema = noteInputSchema;

/** An office asks the CEO Office to clarify, giving one of the reasons the policy allows. */
export const clarificationRequestSchema = z.object({
  reason: z.enum(CLARIFICATION_REASONS, { error: "Choose a reason" }),
  text: reasonText("Explain what needs clarifying"),
});

/** The CEO Office's answer to a clarification request. */
export const clarificationResolutionSchema = z.object({
  decision: z.enum(CLARIFICATION_DECISIONS, { error: "Choose a decision" }),
  note: reasonText("Explain the decision"),
});

export type ListDirectivesQuery = z.infer<typeof listDirectivesQuerySchema>;
export type IssueDirectiveInput = z.infer<typeof issueDirectiveSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type OwnerChoiceInput = z.infer<typeof ownerChoiceSchema>;
export type ProgressNoteInput = z.infer<typeof progressNoteSchema>;
export type DirectiveNoteInput = z.infer<typeof directiveNoteSchema>;
export type ClarificationRequestInput = z.infer<typeof clarificationRequestSchema>;
export type ClarificationResolutionInput = z.infer<typeof clarificationResolutionSchema>;
