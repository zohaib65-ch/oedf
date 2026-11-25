"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ErrorSummary } from "@/components/forms/error-summary";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { MissingDocumentsForm } from "@/features/application-status/missing-documents-form";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { statusLookupSchema, type StatusLookupInput } from "@/lib/validations/application";
import type { PublicApplicationStatus } from "@/server/services/application.service";

const LABELS = { referenceNumber: "Reference number", email: "Email" };
const KNOWN_FIELDS = new Set(Object.keys(LABELS));

export function StatusChecker() {
  const form = useForm<z.input<typeof statusLookupSchema>, unknown, StatusLookupInput>({
    // The error summary takes focus instead of the first invalid field, so a screen reader hears every problem.
    shouldFocusError: false,
    resolver: zodResolver(statusLookupSchema),
    defaultValues: { referenceNumber: "", email: "", faxNumber: "" },
  });
  const [result, setResult] = useState<PublicApplicationStatus | undefined>();
  const [owner, setOwner] = useState<{ referenceNumber: string; email: string } | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [focusKey, setFocusKey] = useState(0);

  const handleSubmit = form.handleSubmit(
    async (values) => {
      setFormError(undefined);
      setResult(undefined);
      try {
        setResult(await apiPost<PublicApplicationStatus>("/applications/status-lookup", values));
        setOwner({ referenceNumber: values.referenceNumber, email: values.email });
      } catch (error: unknown) {
        setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
        setFocusKey((key) => key + 1);
      }
    },
    () => {
      setFocusKey((key) => key + 1);
    },
  );

  return (
    <div className="space-y-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="relative space-y-6 rounded-xl border border-border bg-white p-8 shadow-card"
      >
        <ErrorSummary errors={form.formState.errors} labels={LABELS} focusKey={focusKey} />
        {formError ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <TextField
            control={form.control}
            name="referenceNumber"
            label="Reference number"
            placeholder="OEDF-ADM-2026-000123"
            description="For example OEDF-ADM-2026-000123."
            autoComplete="off"
          />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            placeholder="The email you applied with"
            type="email"
            autoComplete="email"
          />
        </FieldGroup>
        <HoneypotField register={form.register} />
        <SubmitButton isSubmitting={form.formState.isSubmitting}>Check status</SubmitButton>
      </form>

      {result && owner ? (
        <section
          aria-live="polite"
          className="space-y-6 rounded-xl border border-border bg-white p-8 shadow-card"
        >
          <div>
            <p className="text-xs font-bold tracking-widest text-gold-text uppercase">Status</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
              {result.label}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{result.nextStep}</p>
            {result.endedReason ? (
              <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-bold text-foreground">Reason</p>
                <p className="mt-1 whitespace-pre-line text-foreground">{result.endedReason}</p>
              </div>
            ) : null}
          </div>
          {result.status === "INCOMPLETE" ? (
            <MissingDocumentsForm
              key={owner.referenceNumber}
              owner={owner}
              missingItems={result.missingItems}
              onUpdated={setResult}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
