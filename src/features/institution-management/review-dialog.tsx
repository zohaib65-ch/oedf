"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
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
import { apiPost } from "@/lib/api/client";
import {
  reviewFormSchema,
  type ReviewFormInput,
  type ReviewFormValues,
} from "@/lib/validations/institution";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["reviewDate", "rating", "summary"]);

const RATING_OPTIONS = [
  { value: "5", label: "5, excellent" },
  { value: "4", label: "4, good" },
  { value: "3", label: "3, adequate" },
  { value: "2", label: "2, weak" },
  { value: "1", label: "1, poor" },
];

/** Records a performance review, signed with the reviewer's name. */
export function ReviewDialog({ institutionId }: { institutionId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<ReviewFormValues, unknown, ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { reviewDate: "", summary: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await apiPost(`/institutions/${institutionId}/reviews`, values);
      toast.success("Review added.");
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a performance review</DialogTitle>
          <DialogDescription>Internal. Reviews never appear on the public site.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
          {formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <DateField control={form.control} name="reviewDate" label="Review date" />
            <SelectField
              control={form.control}
              name="rating"
              label="Rating"
              placeholder="Choose a rating"
              options={RATING_OPTIONS}
            />
            <TextareaField
              control={form.control}
              name="summary"
              label="Summary"
              placeholder="What was reviewed and what was found"
              rows={4}
              maxLength={2000}
            />
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
            <SaveButton isPending={form.formState.isSubmitting}>Add review</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
