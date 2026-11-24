"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch } from "@/lib/api/client";
import {
  interviewFormSchema,
  type InterviewFormInput,
} from "@/lib/validations/job-application-review";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["interviewAt"]);

interface InterviewFormProps {
  applicationId: string;
  /** The current time as a datetime-local value in Pakistan time, or empty. */
  interviewAtLocal: string;
}

/** Sets, changes or clears the interview time. The candidate is not emailed; staff tell them. */
export function InterviewForm({ applicationId, interviewAtLocal }: InterviewFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<InterviewFormInput>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: { interviewAt: interviewAtLocal },
  });

  const save = async (interviewAt: string) => {
    setFormError(undefined);
    try {
      await apiPatch(`/job-applications/${applicationId}`, { interviewAt });
      toast.success(interviewAt ? "Interview time saved." : "Interview time cleared.");
      form.reset({ interviewAt });
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  };
  const handleSubmit = form.handleSubmit(async (values) => save(values.interviewAt));

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <TextField
        control={form.control}
        name="interviewAt"
        label="Interview date and time"
        type="datetime-local"
        description="Pakistan time."
      />
      <div className="flex flex-wrap gap-2">
        <SaveButton isPending={form.formState.isSubmitting}>Save time</SaveButton>
        {interviewAtLocal ? (
          <Button
            type="button"
            variant="outline"
            disabled={form.formState.isSubmitting}
            onClick={() => void save("")}
          >
            Clear time
          </Button>
        ) : null}
      </div>
    </form>
  );
}
