"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
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
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { STATUS_ACTION_LABELS } from "@/lib/constants/application-workflow";
import type { APPLICATION_STATUSES } from "@/lib/constants/enums";
import { APPLICATION_STATUS_LABELS, AWARD_PERIOD_LABELS, toOptions } from "@/lib/constants/labels";
import {
  applicationStatusChangeSchema,
  type ApplicationStatusChangeFormValues,
  type ApplicationStatusChangeInput,
} from "@/lib/validations/application-review";

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "reason",
  "missingItems",
  "award.amountPkr",
  "award.period",
  "award.startDate",
  "award.renewalDate",
]);

const EXPLANATION: Partial<Record<ApplicationStatus, string>> = {
  INCOMPLETE:
    "The applicant is emailed the list below and can upload the items from the status page.",
  APPROVED: "The applicant is emailed the decision.",
  REJECTED:
    "The applicant is emailed that the application was not successful. Your reason stays internal.",
  WITHDRAWN: "Use this when the applicant asks to withdraw. It cannot be undone.",
};

interface StatusChangeDialogProps {
  applicationId: string;
  target: ApplicationStatus;
  /** Approving a scholarship records its award, so the award terms are asked for too. */
  needsAwardTerms: boolean;
}

/** One status move: the reason is always required, and some moves ask for more. */
export function StatusChangeDialog({
  applicationId,
  target,
  needsAwardTerms,
}: StatusChangeDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<ApplicationStatusChangeFormValues, unknown, ApplicationStatusChangeInput>({
    resolver: zodResolver(applicationStatusChangeSchema),
    defaultValues: {
      status: target,
      reason: "",
      missingItems: "",
      award: needsAwardTerms ? { amountPkr: "", startDate: "", renewalDate: "" } : undefined,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await apiPost(`/applications/${applicationId}/status`, values);
      toast.success(`Application ${APPLICATION_STATUS_LABELS[target].toLowerCase()}.`);
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  const isClosing = target === "REJECTED" || target === "WITHDRAWN";
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isClosing ? "outline" : "default"}>{STATUS_ACTION_LABELS[target]}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{STATUS_ACTION_LABELS[target]}</DialogTitle>
          <DialogDescription>
            Moves the application to {APPLICATION_STATUS_LABELS[target]}.{" "}
            {EXPLANATION[target] ?? ""}
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
            <FieldGroup>
              {target === "INCOMPLETE" ? (
                <TextareaField
                  control={form.control}
                  name="missingItems"
                  label="What the applicant must send"
                  placeholder={"Attested result card\nCopy of guardian's CNIC"}
                  description="One item per line. The applicant sees this list."
                  rows={4}
                />
              ) : null}
              {needsAwardTerms ? (
                <>
                  <TextField
                    control={form.control}
                    name="award.amountPkr"
                    label="Amount (whole rupees)"
                    placeholder="For example 25000"
                    inputMode="numeric"
                  />
                  <SelectField
                    control={form.control}
                    name="award.period"
                    label="Paid"
                    placeholder="Choose how often it is paid"
                    options={toOptions(AWARD_PERIOD_LABELS)}
                  />
                  <DateField control={form.control} name="award.startDate" label="Start date" />
                  <DateField
                    control={form.control}
                    name="award.renewalDate"
                    label="Renewal date"
                    description="Optional. When the award is next reviewed."
                  />
                </>
              ) : null}
              <TextareaField
                control={form.control}
                name="reason"
                label="Reason"
                placeholder="Why the status is changing"
                description="Recorded with your name in the application's history. Not sent to the applicant."
                rows={3}
                maxLength={1000}
              />
            </FieldGroup>
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
            <SaveButton isPending={form.formState.isSubmitting}>
              {STATUS_ACTION_LABELS[target]}
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
