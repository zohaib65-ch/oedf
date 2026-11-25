"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextareaField } from "@/components/forms/textarea-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiDelete } from "@/lib/api/client";
import { awardDeleteSchema, type AwardDeleteInput } from "@/lib/validations/application-review";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["reason"]);

interface DeleteAwardButtonProps {
  awardId: string;
  studentName: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/**
 * Deletes a scholarship award and ends the scholarship. A reason is required: the student is
 * emailed it, and sees it on the status page.
 */
export function DeleteAwardButton({
  awardId,
  studentName,
  isCompact = false,
}: DeleteAwardButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<AwardDeleteInput>({
    resolver: zodResolver(awardDeleteSchema),
    defaultValues: { reason: "" },
  });
  const label = isCompact ? `Delete the award for ${studentName}` : "Delete award";

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await apiDelete(`/scholarship-awards/${awardId}`, values);
      toast.success("Award deleted. The student has been emailed the reason.");
      setIsOpen(false);
      form.reset();
      if (isCompact) {
        router.refresh();
      } else {
        router.push("/portal/scholarship-awards");
      }
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  const trigger = isCompact ? (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="text-destructive hover:text-destructive"
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  ) : (
    <Button variant="destructive">{label}</Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {isCompact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete the award for {studentName}?</DialogTitle>
          <DialogDescription>
            This ends the scholarship. The award and its progress notes are removed for good. The
            student is emailed the reason below and sees it on the status page, which shows
            “Scholarship ended” instead of Approved. This is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-5"
        >
          <DialogBody className="space-y-5">
            {formError ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <TextareaField
              control={form.control}
              name="reason"
              label="Reason (sent to the student)"
              placeholder="For example The scholarship ended because the student left the programme."
              rows={4}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <SaveButton
              isPending={form.formState.isSubmitting}
              pendingLabel="Deleting…"
              variant="destructive"
            >
              Delete and email the student
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
