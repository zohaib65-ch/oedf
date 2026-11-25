"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxListField } from "@/components/forms/checkbox-list-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { DIRECTIVE_PRIORITY_LABELS, toOptions } from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import { issueDirectiveSchema, type IssueDirectiveInput } from "@/lib/validations/directive";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "title",
  "body",
  "departmentIds",
  "dueDate",
  "priority",
]);

interface IssueDirectiveFormProps {
  offices: readonly { value: string; label: string }[];
}

/** A new directive. Issuing emails the Directors of the chosen offices. */
export function IssueDirectiveForm({ offices }: IssueDirectiveFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<IssueDirectiveInput>({
    resolver: zodResolver(issueDirectiveSchema),
    defaultValues: { title: "", body: "", departmentIds: [], dueDate: "", priority: "NORMAL" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const created = await apiPost<{ id: string; referenceNumber: string }>("/directives", values);
      toast.success(`Directive ${created.referenceNumber} issued.`);
      router.push(`/portal/directives/${created.id}`);
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
      <FieldGroup>
        <TextField control={form.control} name="title" label="Title" maxLength={200} />
        <TextareaField
          control={form.control}
          name="body"
          label="Instructions"
          description={`What each office must do. ${FORMATTED_TEXT_HINT}`}
          rows={10}
          maxLength={10_000}
        />
      </FieldGroup>
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <TextField
          control={form.control}
          name="dueDate"
          label="Due date"
          type="date"
          description="The work is overdue from the next day."
        />
        <SelectField
          control={form.control}
          name="priority"
          label="Priority"
          options={toOptions(DIRECTIVE_PRIORITY_LABELS)}
        />
      </FieldGroup>
      <CheckboxListField
        control={form.control}
        name="departmentIds"
        legend="Offices"
        description="Each office acknowledges, names an owner and reports progress on its own part."
        options={offices}
        emptyText="No offices found."
      />
      <SaveButton isPending={form.formState.isSubmitting}>Issue directive</SaveButton>
    </form>
  );
}
