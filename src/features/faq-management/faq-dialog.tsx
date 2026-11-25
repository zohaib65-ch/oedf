"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { ComboboxField } from "@/components/forms/combobox-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import { faqFormSchema, type FaqFormInput } from "@/lib/validations/faq";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "question",
  "answer",
  "category",
  "isPublished",
]);

interface FaqDialogProps {
  /** The question being edited, or nothing to add one. */
  faq?: FaqFormInput & { id: string };
  /** Existing topics, offered in the topic list. */
  topics: readonly string[];
}

/** Adds or edits one question in a dialog: FAQs are short forms. */
export function FaqDialog({ faq, topics }: FaqDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const defaults: FaqFormInput = faq ?? {
    question: "",
    answer: "",
    category: "",
    isPublished: false,
  };
  const form = useForm<FaqFormInput>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: defaults,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (faq) {
        await apiPatch(`/faqs/${faq.id}`, values);
        toast.success("Question saved.");
      } else {
        await apiPost("/faqs", values);
        toast.success("Question added.");
        form.reset(defaults);
      }
      setIsOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          form.reset(defaults);
          setFormError(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        {faq ? (
          <Button variant="outline" size="sm">
            <PencilIcon aria-hidden="true" />
            Edit<span className="sr-only"> “{faq.question}”</span>
          </Button>
        ) : (
          <Button>
            <PlusIcon aria-hidden="true" />
            New question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{faq ? "Edit question" : "New question"}</DialogTitle>
          <DialogDescription>
            Questions are grouped by topic on the public FAQs page. A new one goes to the end of its
            topic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
          {formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <TextField control={form.control} name="question" label="Question" maxLength={300} />
            <TextareaField
              control={form.control}
              name="answer"
              label="Answer"
              description={FORMATTED_TEXT_HINT}
              rows={6}
              maxLength={5000}
            />
            <ComboboxField
              control={form.control}
              name="category"
              label="Topic"
              noun="topic"
              options={topics}
              description="Choose an existing topic, or type a new one to add it."
            />
            <CheckboxField control={form.control} name="isPublished">
              Published (shown on the public FAQs page)
            </CheckboxField>
          </FieldGroup>
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
            <SaveButton isPending={form.formState.isSubmitting}>Save question</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
