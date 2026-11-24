"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorSummary } from "@/components/forms/error-summary";
import { FormSuccess } from "@/components/forms/form-success";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Turnstile } from "@/components/shared/turnstile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FIELD_LABELS,
  getSteps,
  KNOWN_FIELDS,
  type ApplicationFormValues,
  type StepId,
} from "@/features/applications/application-form-config";
import { StepApplicant } from "@/features/applications/step-applicant";
import { StepChoice } from "@/features/applications/step-choice";
import { StepDocuments } from "@/features/applications/step-documents";
import { StepEducation } from "@/features/applications/step-education";
import { StepFinancial } from "@/features/applications/step-financial";
import { StepReview } from "@/features/applications/step-review";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { applicationSchema, type ApplicationInput } from "@/lib/validations/application";
import type { ApplicationProgramOption } from "@/server/repositories/program.repository";

interface ApplicationFormProps {
  type: "ADMISSION" | "SCHOLARSHIP";
  programs: readonly ApplicationProgramOption[];
  turnstileSiteKey: string | undefined;
}

function buildDefaults(type: "ADMISSION" | "SCHOLARSHIP"): Partial<ApplicationFormValues> {
  const base = {
    intakeSession: "",
    applicant: {
      fullName: "",
      guardianName: "",
      dateOfBirth: "",
      cnic: "",
      email: "",
      phone: "",
      address: "",
      city: "",
    },
    education: {
      lastInstitution: "",
      classOrDegree: "",
      boardOrUniversity: "",
      marksOrPercentage: "",
      passingYear: "",
    },
    documents: {},
    faxNumber: "",
  };
  if (type === "SCHOLARSHIP") {
    return {
      ...base,
      type,
      financial: {
        monthlyIncomePkr: "",
        familySize: "",
        guardianOccupation: "",
        otherSupport: "",
        statementOfNeed: "",
      },
    } as Partial<ApplicationFormValues>;
  }
  return { ...base, type } as Partial<ApplicationFormValues>;
}

/**
 * The admission and scholarship application, one question group at a time. Each step is checked
 * before the next opens, answers are kept when going back, and a summary comes before sending.
 */
export function ApplicationForm({ type, programs, turnstileSiteKey }: ApplicationFormProps) {
  const steps = getSteps(type);
  const form = useForm<ApplicationFormValues, unknown, ApplicationInput>({
    // The error summary takes focus instead of the first invalid field, so a screen reader hears every problem.
    shouldFocusError: false,
    resolver: zodResolver(applicationSchema),
    defaultValues: buildDefaults(type),
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const [stepFocusKey, setStepFocusKey] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = steps[stepIndex] ?? steps[0];
  const isLastStep = stepIndex === steps.length - 1;

  // After moving between steps, put focus on the new step's heading so screen readers announce it.
  useEffect(() => {
    if (stepFocusKey > 0) {
      headingRef.current?.focus();
    }
  }, [stepFocusKey]);

  if (!step) {
    return null;
  }

  const goTo = (index: number) => {
    setStepFocusKey((key) => key + 1);
    setStepIndex(index);
  };

  const goToStep = (id: StepId) => {
    const index = steps.findIndex((candidate) => candidate.id === id);
    if (index >= 0) {
      goTo(index);
    }
  };

  const handleNext = async () => {
    const isValid = await form.trigger(step.fields);
    if (isValid) {
      setFormError(undefined);
      goTo(stepIndex + 1);
    } else {
      setFocusKey((key) => key + 1);
    }
  };

  /** Sends the visitor to the first step that has a problem (a rule only the server could check). */
  const showFirstInvalidStep = () => {
    const errorNames = Object.keys(form.formState.errors);
    const index = steps.findIndex((candidate) =>
      candidate.fields.some((field) => errorNames.includes(field.split(".")[0] ?? field)),
    );
    if (index >= 0 && index !== stepIndex) {
      goTo(index);
    }
    setFocusKey((key) => key + 1);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    if (turnstileSiteKey && !turnstileToken) {
      setFormError("Please complete the spam check.");
      setFocusKey((key) => key + 1);
      return;
    }
    try {
      const result = await apiPost<{ referenceNumber: string }>("/applications", {
        ...values,
        turnstileToken,
      });
      setReferenceNumber(result.referenceNumber);
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
      setResetKey((key) => key + 1);
      showFirstInvalidStep();
    }
  }, showFirstInvalidStep);

  if (referenceNumber) {
    return (
      <FormSuccess title="Application submitted">
        <p>Your reference number is</p>
        <p className="text-2xl font-extrabold tracking-wide text-navy">{referenceNumber}</p>
        <p>
          We have emailed you a confirmation. Keep this number: you need it, with your email
          address, to check your application.
        </p>
        <p>
          <Link
            href="/application-status"
            className="font-semibold text-navy underline underline-offset-2"
          >
            Check your application status
          </Link>
        </p>
      </FormSuccess>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        // Pressing Enter in a field must move to the next step, never send an unfinished form.
        event.preventDefault();
        if (isLastStep) {
          void handleSubmit(event);
        } else {
          void handleNext();
        }
      }}
      noValidate
      className="relative space-y-8"
    >
      <ol aria-label="Progress" className="flex flex-wrap gap-2">
        {steps.map((candidate, index) => (
          <li
            key={candidate.id}
            aria-current={index === stepIndex ? "step" : undefined}
            className={
              index === stepIndex
                ? "rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white"
                : index < stepIndex
                  ? "rounded-full border border-navy px-4 py-1.5 text-sm font-semibold text-navy"
                  : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
            }
          >
            {index + 1}. {candidate.title}
            {index < stepIndex ? <span className="sr-only"> (completed)</span> : null}
          </li>
        ))}
      </ol>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-extrabold tracking-tight text-foreground outline-none"
      >
        Step {stepIndex + 1} of {steps.length}: {step.title}
      </h2>

      <ErrorSummary errors={form.formState.errors} labels={FIELD_LABELS} focusKey={focusKey} />
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {step.id === "applicant" ? <StepApplicant form={form} /> : null}
      {step.id === "education" ? <StepEducation form={form} /> : null}
      {step.id === "choice" ? <StepChoice form={form} programs={programs} /> : null}
      {step.id === "documents" ? <StepDocuments form={form} /> : null}
      {step.id === "financial" ? <StepFinancial form={form} /> : null}
      {step.id === "review" ? (
        <StepReview form={form} programs={programs} onEdit={goToStep} />
      ) : null}

      {isLastStep ? (
        <>
          <HoneypotField register={form.register} />
          <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetKey={resetKey} />
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        {stepIndex > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              goTo(stepIndex - 1);
            }}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        {isLastStep ? (
          <SubmitButton isSubmitting={form.formState.isSubmitting}>Submit application</SubmitButton>
        ) : (
          <Button
            type="submit"
            size="lg"
            className="h-14 rounded-full bg-navy px-8 text-base font-semibold text-white hover:bg-navy/90"
          >
            Next
          </Button>
        )}
      </div>
    </form>
  );
}
