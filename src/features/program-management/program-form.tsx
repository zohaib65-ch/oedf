"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { CheckboxListField } from "@/components/forms/checkbox-list-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ImageFields } from "@/components/portal/image-fields";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { CONTENT_STATUS_LABELS, PROGRAM_CATEGORY_LABELS, toOptions } from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import {
  programFormSchema,
  type ProgramFormInput,
  type ProgramFormValues,
} from "@/lib/validations/program";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "title",
  "category",
  "summary",
  "description",
  "duration",
  "eligibility",
  "institutionIds",
  "acceptsApplications",
  "status",
  "image",
  "imageAlt",
]);

interface ProgramFormProps {
  /** The program being edited, or nothing for a new one. */
  programId?: string;
  defaultValues: Partial<ProgramFormValues>;
  institutions: readonly { value: string; label: string }[];
  /** Directors choose any status; Staff save drafts only. */
  canPublish: boolean;
  /** The saved image, shown above the image field. */
  currentImage?: { url: string; width: number; height: number; alt: string } | null;
}

/** The whole program on one page. */
export function ProgramForm({
  programId,
  defaultValues,
  institutions,
  canPublish,
  currentImage,
}: ProgramFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<ProgramFormValues, unknown, ProgramFormInput>({
    resolver: zodResolver(programFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (programId) {
        await apiPatch(`/programs/${programId}`, values);
        toast.success("Program saved.");
        router.refresh();
      } else {
        const created = await apiPost<{ id: string }>("/programs", values);
        toast.success(values.status === "DRAFT" ? "Draft saved." : "Program saved.");
        router.push(`/portal/programs/${created.id}`);
      }
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  const statusOptions = toOptions(CONTENT_STATUS_LABELS).filter(
    (option) => canPublish || option.value === "DRAFT",
  );

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <TextField control={form.control} name="title" label="Title" maxLength={150} />
        <SelectField
          control={form.control}
          name="category"
          label="Category"
          options={toOptions(PROGRAM_CATEGORY_LABELS)}
        />
        <TextField
          control={form.control}
          name="duration"
          label="Duration"
          description="Optional, for example “6 months”."
          maxLength={100}
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={statusOptions}
          description={
            canPublish
              ? "Published programs are on the public site; archived ones are hidden."
              : "A Director publishes the program."
          }
        />
      </FieldGroup>
      <FieldGroup>
        <TextareaField
          control={form.control}
          name="summary"
          label="Summary"
          description="One or two sentences for cards and search results."
          rows={2}
          maxLength={300}
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          description={`Optional. ${FORMATTED_TEXT_HINT}`}
          rows={10}
          maxLength={10_000}
        />
        <TextareaField
          control={form.control}
          name="eligibility"
          label="Eligibility"
          description={`Optional. ${FORMATTED_TEXT_HINT}`}
          rows={6}
          maxLength={10_000}
        />
        <CheckboxField control={form.control} name="acceptsApplications">
          Accepts applications (shown in the admission form while published)
        </CheckboxField>
        <CheckboxListField
          control={form.control}
          name="institutionIds"
          legend="Offered at"
          options={institutions}
          emptyText="No institutions yet. Add them under Institutions first."
        />
        <ImageFields control={form.control} currentImage={currentImage ?? null} />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting}>Save program</SaveButton>
    </form>
  );
}
