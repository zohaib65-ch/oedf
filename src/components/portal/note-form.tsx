"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextareaField } from "@/components/forms/textarea-field";
import { SaveButton } from "@/components/portal/save-button";
import { apiPost } from "@/lib/api/client";
import { toastApiError } from "@/lib/api/use-api-action";
import { noteInputSchema } from "@/lib/validations/application-review";

interface NoteFormProps {
  /** The API path that takes the note, for example `/applications/{id}/notes`. */
  endpoint: string;
  label: string;
}

/** Adds an internal note (or a progress update) to a record's timeline. */
export function NoteForm({ endpoint, label }: NoteFormProps) {
  const router = useRouter();
  const form = useForm<{ body: string }>({
    resolver: zodResolver(noteInputSchema),
    defaultValues: { body: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await apiPost(endpoint, values);
      toast.success("Note added.");
      form.reset({ body: "" });
      router.refresh();
    } catch (error: unknown) {
      toastApiError(error);
    }
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-3">
      <TextareaField control={form.control} name="body" label={label} rows={3} maxLength={2000} />
      <SaveButton isPending={form.formState.isSubmitting} variant="outline">
        Add note
      </SaveButton>
    </form>
  );
}
