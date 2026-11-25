"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";

import { ErrorSummary } from "@/components/forms/error-summary";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { UploadField } from "@/components/forms/upload-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { DOCUMENT_KINDS } from "@/lib/constants/enums";
import { DOCUMENT_KIND_LABELS } from "@/lib/constants/labels";
import { missingDocumentsSchema } from "@/lib/validations/application";
import type { PublicApplicationStatus } from "@/server/services/application.service";

const MAX_ROWS = 6;
const KIND_OPTIONS = DOCUMENT_KINDS.map((value) => ({ value, label: DOCUMENT_KIND_LABELS[value] }));

// The reference number and email come from the status lookup, so this form asks only for the files.
const formSchema = missingDocumentsSchema.pick({
  documents: true,
  faxNumber: true,
});

// A new row starts empty; its fields are required only when the form is submitted.
const emptyRow = () => ({}) as z.input<typeof formSchema>["documents"][number];

interface MissingDocumentsFormProps {
  owner: { referenceNumber: string; email: string };
  missingItems: readonly string[];
  onUpdated: (status: PublicApplicationStatus) => void;
}

/** Lets an applicant upload the documents staff asked for while the application is incomplete. */
export function MissingDocumentsForm({
  owner,
  missingItems,
  onUpdated,
}: MissingDocumentsFormProps) {
  const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    // The error summary takes focus instead of the first invalid field, so a screen reader hears every problem.
    shouldFocusError: false,
    resolver: zodResolver(formSchema),
    defaultValues: { documents: [{ kind: undefined, file: undefined }] },
  });
  const rows = useFieldArray({ control: form.control, name: "documents" });
  const [formError, setFormError] = useState<string | undefined>();
  const [focusKey, setFocusKey] = useState(0);

  const labels = Object.fromEntries(
    rows.fields.flatMap((_, index) => [
      [`documents.${index}.kind`, `Document ${index + 1} type`],
      [`documents.${index}.file`, `Document ${index + 1} file`],
    ]),
  );
  const knownFields = new Set(Object.keys(labels));

  const handleSubmit = form.handleSubmit(
    async (values) => {
      setFormError(undefined);
      try {
        onUpdated(
          await apiPost<PublicApplicationStatus>("/applications/missing-documents", {
            ...owner,
            ...values,
          }),
        );
      } catch (error: unknown) {
        setFormError(applyApiErrors(error, form.setError, knownFields));
        setFocusKey((key) => key + 1);
      }
    },
    () => {
      setFocusKey((key) => key + 1);
    },
  );

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="space-y-6 border-t border-border pt-6"
    >
      <div>
        <h3 className="text-xl font-bold text-foreground">Upload the documents we asked for</h3>
        {missingItems.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-lg text-foreground">
            {missingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <ErrorSummary errors={form.formState.errors} labels={labels} focusKey={focusKey} />
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      {rows.fields.map((row, index) => (
        <fieldset key={row.id} className="space-y-4 rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-semibold text-foreground">
            Document {index + 1}
          </legend>
          <SelectField
            control={form.control}
            name={`documents.${index}.kind`}
            label="Type of document"
            placeholder="Choose a type of document"
            options={KIND_OPTIONS}
          />
          <UploadField
            control={form.control}
            name={`documents.${index}.file`}
            label="File"
            purpose="APPLICATION_DOCUMENT"
          />
          {rows.fields.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                rows.remove(index);
              }}
            >
              <Trash2Icon aria-hidden="true" />
              Remove document {index + 1}
            </Button>
          ) : null}
        </fieldset>
      ))}
      {rows.fields.length < MAX_ROWS ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            rows.append(emptyRow());
          }}
        >
          <PlusIcon aria-hidden="true" />
          Add another document
        </Button>
      ) : null}
      <SubmitButton isSubmitting={form.formState.isSubmitting}>Send documents</SubmitButton>
    </form>
  );
}
