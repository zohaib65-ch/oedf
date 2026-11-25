"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ConfirmButton } from "@/components/portal/confirm-button";
import { ActionDialog } from "@/features/directive-management/action-dialog";
import { apiPatch, apiPost } from "@/lib/api/client";
import {
  CLARIFICATION_DECISION_LABELS,
  CLARIFICATION_REASON_LABELS,
  toOptions,
} from "@/lib/constants/labels";
import {
  clarificationRequestSchema,
  clarificationResolutionSchema,
  ownerChoiceSchema,
  progressNoteSchema,
  type ClarificationRequestInput,
  type ClarificationResolutionInput,
  type OwnerChoiceInput,
  type ProgressNoteInput,
} from "@/lib/validations/directive";

/** What this person may do on one office's part, worked out on the server. */
export interface AssignmentAbilities {
  canAcknowledge: boolean;
  canChooseOwner: boolean;
  /** The next status the office may move to itself, if any. */
  nextStatus: "IN_PROGRESS" | "COMPLETED" | null;
  canAskClarification: boolean;
  canResolve: boolean;
}

interface AssignmentActionsProps {
  directiveId: string;
  assignmentId: string;
  officeName: string;
  abilities: AssignmentAbilities;
  ownerChoices: readonly { value: string; label: string }[];
  currentOwnerId: string | null;
}

const OWNER_FIELDS: ReadonlySet<string> = new Set(["ownerId", "note"]);
const PROGRESS_FIELDS: ReadonlySet<string> = new Set(["note"]);
const CLARIFICATION_FIELDS: ReadonlySet<string> = new Set(["reason", "text"]);
const RESOLUTION_FIELDS: ReadonlySet<string> = new Set(["decision", "note"]);

const PROGRESS_TEXT = {
  IN_PROGRESS: {
    label: "Start work",
    title: "Start work on this directive",
    description: "Marks the office's part as in progress. Add a note on the plan if it helps.",
    done: "Marked as in progress.",
  },
  COMPLETED: {
    label: "Mark completed",
    title: "Mark this office's part completed",
    description: "Say what was done. The note is kept in the history for the issuing office.",
    done: "Marked as completed.",
  },
} as const;

/** The buttons for one office's part of a directive. Each one is shown only when it applies. */
export function AssignmentActions({
  directiveId,
  assignmentId,
  officeName,
  abilities,
  ownerChoices,
  currentOwnerId,
}: AssignmentActionsProps) {
  const router = useRouter();
  const base = `/directives/${directiveId}`;
  const context = officeName;

  const ownerForm = useForm<OwnerChoiceInput>({
    resolver: zodResolver(ownerChoiceSchema),
    defaultValues: { note: "", ownerId: currentOwnerId ?? "" },
  });
  // The status is not a field: it comes from the button, which follows the refreshed page.
  const progressForm = useForm<ProgressNoteInput>({
    resolver: zodResolver(progressNoteSchema),
    defaultValues: { note: "" },
  });
  const clarificationForm = useForm<ClarificationRequestInput>({
    resolver: zodResolver(clarificationRequestSchema),
    defaultValues: { text: "" },
  });
  const resolutionForm = useForm<ClarificationResolutionInput>({
    resolver: zodResolver(clarificationResolutionSchema),
    defaultValues: { note: "" },
  });

  const hasAny =
    abilities.canAcknowledge ||
    abilities.canChooseOwner ||
    abilities.nextStatus !== null ||
    abilities.canAskClarification ||
    abilities.canResolve;
  if (!hasAny) {
    return null;
  }
  const progress = abilities.nextStatus ? PROGRESS_TEXT[abilities.nextStatus] : null;

  return (
    <div className="flex flex-wrap gap-2">
      {abilities.canAcknowledge ? (
        <ConfirmButton
          label="Acknowledge"
          title={`Acknowledge for ${officeName}?`}
          description="Confirms your office has received the directive. Next, choose who owns the work."
          onConfirm={async () => {
            await apiPost(`${base}/assignments/${assignmentId}/acknowledge`, {});
            toast.success("Directive acknowledged.");
            router.refresh();
          }}
        />
      ) : null}
      {abilities.canChooseOwner ? (
        <ActionDialog
          label={currentOwnerId ? "Change owner" : "Choose owner"}
          context={context}
          title="Who owns this work?"
          description="The owner carries out the office's part and posts progress updates."
          form={ownerForm}
          knownFields={OWNER_FIELDS}
          variant={currentOwnerId ? "outline" : "default"}
          onSubmit={async (values) => {
            await apiPatch(`${base}/assignments/${assignmentId}`, {
              ownerId: values.ownerId,
              note: values.note,
            });
            toast.success("Owner saved.");
            router.refresh();
          }}
        >
          <SelectField
            control={ownerForm.control}
            name="ownerId"
            label="Owner"
            options={ownerChoices}
            placeholder="Choose a person"
          />
          <TextareaField
            control={ownerForm.control}
            name="note"
            label="Note"
            description="Optional. Kept with the progress updates."
            rows={3}
            maxLength={2000}
          />
        </ActionDialog>
      ) : null}
      {progress && abilities.nextStatus ? (
        <ActionDialog
          label={progress.label}
          context={context}
          title={progress.title}
          description={progress.description}
          form={progressForm}
          knownFields={PROGRESS_FIELDS}
          onSubmit={async (values) => {
            await apiPatch(`${base}/assignments/${assignmentId}`, {
              status: abilities.nextStatus,
              note: values.note,
            });
            toast.success(progress.done);
            router.refresh();
          }}
        >
          <TextareaField
            control={progressForm.control}
            name="note"
            label="Note"
            rows={4}
            maxLength={2000}
          />
        </ActionDialog>
      ) : null}
      {abilities.canAskClarification ? (
        <ActionDialog
          label="Ask for clarification"
          context={context}
          title="Ask the CEO Office for clarification"
          description="Use this only when the directive conflicts with the law, the constitutional documents, a Board resolution or a donor restriction, or cannot be carried out. The CEO Office is emailed and decides."
          form={clarificationForm}
          knownFields={CLARIFICATION_FIELDS}
          variant="outline"
          onSubmit={async (values) => {
            await apiPost(`${base}/assignments/${assignmentId}/clarification`, values);
            toast.success("Clarification requested. The CEO Office has been told.");
            router.refresh();
          }}
        >
          <SelectField
            control={clarificationForm.control}
            name="reason"
            label="Reason"
            options={toOptions(CLARIFICATION_REASON_LABELS)}
            placeholder="Choose a reason"
          />
          <TextareaField
            control={clarificationForm.control}
            name="text"
            label="Explanation"
            description="What conflicts, and what you need decided."
            rows={5}
            maxLength={2000}
          />
        </ActionDialog>
      ) : null}
      {abilities.canResolve ? (
        <ActionDialog
          label="Resolve clarification"
          context={context}
          title={`Resolve ${officeName}'s clarification`}
          description="Reopen returns the office's part to where it was; close releases the office from this directive."
          form={resolutionForm}
          knownFields={RESOLUTION_FIELDS}
          onSubmit={async (values) => {
            await apiPost(`${base}/assignments/${assignmentId}/resolve`, values);
            toast.success("Clarification resolved.");
            router.refresh();
          }}
        >
          <SelectField
            control={resolutionForm.control}
            name="decision"
            label="Decision"
            options={toOptions(CLARIFICATION_DECISION_LABELS)}
            placeholder="Choose a decision"
          />
          <TextareaField
            control={resolutionForm.control}
            name="note"
            label="Reason for the decision"
            rows={4}
            maxLength={2000}
          />
        </ActionDialog>
      ) : null}
    </div>
  );
}
