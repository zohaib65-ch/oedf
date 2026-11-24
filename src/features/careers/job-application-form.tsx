"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ErrorSummary } from "@/components/forms/error-summary";
import { FormSuccess } from "@/components/forms/form-success";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { UploadField } from "@/components/forms/upload-field";
import { Turnstile } from "@/components/shared/turnstile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { jobApplicationSchema, type JobApplicationInput } from "@/lib/validations/job-application";

const LABELS = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  cnic: "CNIC number",
  city: "City",
  highestQualification: "Highest qualification",
  yearsOfExperience: "Years of experience",
  coverLetter: "Cover letter",
  cv: "CV",
};
const KNOWN_FIELDS = new Set(Object.keys(LABELS));

interface JobApplicationFormProps {
  vacancySlug: string;
  turnstileSiteKey: string | undefined;
}

export function JobApplicationForm({ vacancySlug, turnstileSiteKey }: JobApplicationFormProps) {
  const form = useForm<z.input<typeof jobApplicationSchema>, unknown, JobApplicationInput>({
    // The error summary takes focus instead of the first invalid field, so a screen reader hears every problem.
    shouldFocusError: false,
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      vacancySlug,
      fullName: "",
      email: "",
      phone: "",
      cnic: "",
      city: "",
      highestQualification: "",
      yearsOfExperience: "",
      coverLetter: "",
      faxNumber: "",
    },
  });
  const [referenceNumber, setReferenceNumber] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [focusKey, setFocusKey] = useState(0);

  const handleSubmit = form.handleSubmit(
    async (values) => {
      setFormError(undefined);
      if (turnstileSiteKey && !turnstileToken) {
        setFormError("Please complete the spam check.");
        setFocusKey((key) => key + 1);
        return;
      }
      try {
        const result = await apiPost<{ referenceNumber: string }>("/job-applications", {
          ...values,
          turnstileToken,
        });
        setReferenceNumber(result.referenceNumber);
      } catch (error: unknown) {
        setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
        setResetKey((key) => key + 1);
        setFocusKey((key) => key + 1);
      }
    },
    () => {
      setFocusKey((key) => key + 1);
    },
  );

  if (referenceNumber) {
    return (
      <FormSuccess title="Application received">
        <p>Your reference number is</p>
        <p className="text-2xl font-extrabold tracking-wide text-navy">{referenceNumber}</p>
        <p>We have emailed you a confirmation. Keep this number for your records.</p>
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="relative space-y-6">
      <ErrorSummary errors={form.formState.errors} labels={LABELS} focusKey={focusKey} />
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <TextField control={form.control} name="fullName" label="Full name" autoComplete="name" />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
        />
        <TextField
          control={form.control}
          name="cnic"
          label="CNIC number"
          inputMode="numeric"
          description="13 digits, with or without dashes."
        />
        <TextField control={form.control} name="city" label="City" autoComplete="address-level2" />
        <TextField
          control={form.control}
          name="highestQualification"
          label="Highest qualification"
        />
        <TextField
          control={form.control}
          name="yearsOfExperience"
          label="Years of experience"
          type="number"
          inputMode="numeric"
        />
        <TextareaField
          control={form.control}
          name="coverLetter"
          label="Cover letter (optional)"
          rows={6}
        />
        <UploadField control={form.control} name="cv" label="CV" purpose="CV" />
      </FieldGroup>
      <HoneypotField register={form.register} />
      <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetKey={resetKey} />
      <SubmitButton isSubmitting={form.formState.isSubmitting}>Submit application</SubmitButton>
    </form>
  );
}
