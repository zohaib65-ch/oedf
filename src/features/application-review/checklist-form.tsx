"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { SaveButton } from "@/components/portal/save-button";
import { FieldGroup } from "@/components/ui/field";
import { apiPatch } from "@/lib/api/client";
import { toastApiError } from "@/lib/api/use-api-action";
import { CHECKLIST_ITEMS } from "@/lib/constants/application-workflow";
import { checklistSchema, type ChecklistInput } from "@/lib/validations/application-review";

interface ChecklistFormProps {
  applicationId: string;
  checklist: ChecklistInput;
  /** False once the application is verified, or for someone who may not review. */
  isEditable: boolean;
}

/** The verification checklist. Every item must be ticked before the application can be Verified. */
export function ChecklistForm({ applicationId, checklist, isEditable }: ChecklistFormProps) {
  const router = useRouter();
  const form = useForm<ChecklistInput>({
    resolver: zodResolver(checklistSchema),
    defaultValues: checklist,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await apiPatch(`/applications/${applicationId}/checklist`, values);
      toast.success("Checklist saved.");
      router.refresh();
    } catch (error: unknown) {
      toastApiError(error);
    }
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
      <FieldGroup>
        {CHECKLIST_ITEMS.map((item) => (
          <CheckboxField
            key={item.key}
            control={form.control}
            name={item.key}
            isDisabled={!isEditable}
          >
            {item.label}
          </CheckboxField>
        ))}
      </FieldGroup>
      {isEditable ? (
        <SaveButton isPending={form.formState.isSubmitting} variant="outline">
          Save checklist
        </SaveButton>
      ) : null}
    </form>
  );
}
