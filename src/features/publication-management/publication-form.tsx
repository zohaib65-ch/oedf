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
import { UploadField } from "@/components/forms/upload-field";
import { ImageFields } from "@/components/portal/image-fields";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { CONTENT_STATUS_LABELS, PUBLICATION_TYPE_LABELS, toOptions } from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import {
  publicationFormSchema,
  type PublicationFormInput,
  type PublicationFormValues,
} from "@/lib/validations/publication";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "title",
  "type",
  "summary",
  "authors",
  "tags",
  "publishedOn",
  "pdf",
  "status",
  "image",
  "imageAlt",
]);

interface PublicationFormProps {
  /** The publication being edited, or nothing for a new one. */
  publicationId?: string;
  defaultValues: Partial<PublicationFormValues>;
  /** Directors choose any status; Staff save drafts only. */
  canPublish: boolean;
  /** The saved cover, shown above the image field. */
  currentImage?: { url: string; width: number; height: number; alt: string } | null;
}

/** The whole publication on one page. */
export function PublicationForm({
  publicationId,
  defaultValues,
  canPublish,
  currentImage,
}: PublicationFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<PublicationFormValues, unknown, PublicationFormInput>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (publicationId) {
        await apiPatch(`/publications/${publicationId}`, values);
        toast.success("Publication saved.");
        router.refresh();
      } else {
        const created = await apiPost<{ id: string }>("/publications", values);
        toast.success(values.status === "DRAFT" ? "Draft saved." : "Publication saved.");
        router.push(`/portal/publications/${created.id}`);
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
        <TextField
          control={form.control}
          name="title"
          label="Title"
          placeholder="Title of the publication"
          maxLength={200}
        />
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          placeholder="Choose a type"
          options={toOptions(PUBLICATION_TYPE_LABELS)}
        />
        <DateField
          control={form.control}
          name="publishedOn"
          label="Publish date"
          description="Optional. Left empty, it is the day the publication is published."
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          placeholder="Choose a status"
          options={statusOptions}
          description={
            canPublish
              ? "Published publications are on the Research page; archived ones are hidden."
              : "A Director publishes the publication."
          }
        />
      </FieldGroup>
      <FieldGroup>
        <TextareaField
          control={form.control}
          name="summary"
          label="Summary"
          placeholder="What the publication covers and its main findings"
          description={`Shown on cards and the public page. ${FORMATTED_TEXT_HINT}`}
          rows={8}
          maxLength={10_000}
        />
        <TextField
          control={form.control}
          name="authors"
          label="Authors"
          placeholder="For example Ayesha Khan, Bilal Ahmed"
          description="Optional. Separate names with commas."
          maxLength={2000}
        />
        <TextField
          control={form.control}
          name="tags"
          label="Topics"
          placeholder="For example literacy, rural schools"
          description="Optional. Separate topics with commas, for example “literacy, rural schools”."
          maxLength={1000}
        />
        <UploadField
          control={form.control}
          name="pdf"
          label="Full PDF"
          purpose="PUBLICATION_PDF"
          description="Optional. PDF, up to 5 MB. Visitors can download it once the publication is published."
        />
        <ImageFields control={form.control} currentImage={currentImage ?? null} />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting}>Save publication</SaveButton>
    </form>
  );
}
