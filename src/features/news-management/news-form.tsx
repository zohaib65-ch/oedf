"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ImageFields } from "@/components/portal/image-fields";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { CONTENT_STATUS_LABELS, NEWS_TYPE_LABELS, toOptions } from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import {
  MAX_SEO_DESCRIPTION_LENGTH,
  MAX_SEO_TITLE_LENGTH,
  newsFormSchema,
  type NewsFormInput,
  type NewsFormValues,
} from "@/lib/validations/news";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "title",
  "type",
  "excerpt",
  "body",
  "eventDate",
  "eventStartTime",
  "venue",
  "status",
  "publishedOn",
  "seoTitle",
  "seoDescription",
  "image",
  "imageAlt",
]);

interface NewsFormProps {
  /** The post being edited, or nothing for a new one. */
  postId?: string;
  defaultValues: Partial<NewsFormValues>;
  currentImage?: { url: string; width: number; height: number; alt: string } | null;
}

/** A news post or event on one page. Events also have a date and venue. */
export function NewsForm({ postId, defaultValues, currentImage }: NewsFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<NewsFormValues, unknown, NewsFormInput>({
    resolver: zodResolver(newsFormSchema),
    defaultValues,
  });
  const type = useWatch({ control: form.control, name: "type" });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (postId) {
        await apiPatch(`/news/${postId}`, values);
        toast.success("Post saved.");
        router.refresh();
      } else {
        const created = await apiPost<{ id: string }>("/news", values);
        toast.success(values.status === "DRAFT" ? "Draft saved." : "Post saved.");
        router.push(`/portal/news/${created.id}`);
      }
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <TextField control={form.control} name="title" label="Title" maxLength={200} />
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          options={toOptions(NEWS_TYPE_LABELS)}
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={toOptions(CONTENT_STATUS_LABELS)}
          description="Published posts are on the News page; archived ones are hidden."
        />
        <TextField
          control={form.control}
          name="publishedOn"
          label="Publish date"
          type="date"
          description="Optional. Left empty, it is the moment the post is published."
        />
        {type === "EVENT" ? (
          <>
            <TextField control={form.control} name="eventDate" label="Event date" type="date" />
            <TextField
              control={form.control}
              name="eventStartTime"
              label="Start time"
              type="time"
              description="Optional, in Pakistan time. Leave empty for an all-day event."
            />
            <TextField
              control={form.control}
              name="venue"
              label="Venue"
              description="Optional."
              maxLength={200}
            />
          </>
        ) : null}
      </FieldGroup>
      <FieldGroup>
        <TextareaField
          control={form.control}
          name="excerpt"
          label="Excerpt"
          description="One or two sentences for cards and search results."
          rows={2}
          maxLength={300}
        />
        <TextareaField
          control={form.control}
          name="body"
          label="Body"
          description={FORMATTED_TEXT_HINT}
          rows={14}
          maxLength={20_000}
        />
        <ImageFields control={form.control} currentImage={currentImage ?? null} />
      </FieldGroup>
      <FieldSet>
        <FieldLegend>Search engines</FieldLegend>
        <FieldGroup>
          <TextField
            control={form.control}
            name="seoTitle"
            label="Search title"
            description={`Optional; the title is used when empty. Up to ${String(MAX_SEO_TITLE_LENGTH)} characters.`}
            maxLength={MAX_SEO_TITLE_LENGTH}
          />
          <TextareaField
            control={form.control}
            name="seoDescription"
            label="Search description"
            description={`Optional; the excerpt is used when empty. Up to ${String(MAX_SEO_DESCRIPTION_LENGTH)} characters.`}
            rows={2}
            maxLength={MAX_SEO_DESCRIPTION_LENGTH}
          />
        </FieldGroup>
      </FieldSet>
      <SaveButton isPending={form.formState.isSubmitting}>Save post</SaveButton>
    </form>
  );
}
