"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import type { JOB_APPLICATION_STATUSES } from "@/lib/constants/enums";
import { JOB_STATUS_ACTION_LABELS } from "@/lib/constants/job-application-workflow";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import {
  jobApplicationStatusChangeSchema,
  type JobApplicationStatusChangeInput,
} from "@/lib/validations/job-application-review";

type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["reason"]);

const EXPLANATION: Partial<Record<JobApplicationStatus, string>> = {
  SELECTED: "This records a recommendation only. No appointment or contract is made in the system.",
  REJECTED: "This ends the process for this candidate. It cannot be undone.",
};

interface JobStatusDialogProps {
  applicationId: string;
  target: JobApplicationStatus;
}

/** One status move, with the reason recorded in the history. Candidates are not emailed. */
export function JobStatusDialog({ applicationId, target }: JobStatusDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<JobApplicationStatusChangeInput>({
    resolver: zodResolver(jobApplicationStatusChangeSchema),
    defaultValues: { status: target, reason: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await apiPost(`/job-applications/${applicationId}/status`, values);
      toast.success(`Moved to ${JOB_APPLICATION_STATUS_LABELS[target].toLowerCase()}.`);
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  const label = JOB_STATUS_ACTION_LABELS[target];
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={target === "REJECTED" || target === "ON_HOLD" ? "outline" : "default"}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Moves the application to {JOB_APPLICATION_STATUS_LABELS[target]}.{" "}
            {EXPLANATION[target] ?? ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
          {formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <TextareaField
            control={form.control}
            name="reason"
            label="Reason"
            placeholder="Why the status is changing"
            description="Recorded with your name in the application's history. The candidate does not see it."
            rows={3}
            maxLength={1000}
          />
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
            <SaveButton isPending={form.formState.isSubmitting}>{label}</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
