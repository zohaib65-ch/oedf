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
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { EMPLOYMENT_TYPE_LABELS, toOptions } from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import { vacancyFormSchema, type VacancyFormInput } from "@/lib/validations/vacancy";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(Object.keys(vacancyFormSchema.shape));

interface VacancyFormProps {
  /** The vacancy being edited, or nothing for a new one. */
  vacancyId?: string;
  defaultValues: Partial<VacancyFormInput>;
  offices: readonly { value: string; label: string }[];
}

/** The whole vacancy on one page. A new vacancy is saved as a draft. */
export function VacancyForm({ vacancyId, defaultValues, offices }: VacancyFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<VacancyFormInput>({
    resolver: zodResolver(vacancyFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (vacancyId) {
        await apiPatch(`/vacancies/${vacancyId}`, values);
        toast.success("Vacancy saved.");
        router.refresh();
      } else {
        const created = await apiPost<{ id: string }>("/vacancies", values);
        toast.success("Draft saved. A Director publishes it.");
        router.push(`/portal/vacancies/${created.id}`);
      }
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
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
          placeholder="For example Program Officer"
          maxLength={150}
        />
        <SelectField
          control={form.control}
          name="departmentId"
          label="Office"
          placeholder="Choose an office"
          options={offices}
        />
        <TextField
          control={form.control}
          name="city"
          label="City"
          placeholder="For example Lahore"
          maxLength={80}
        />
        <SelectField
          control={form.control}
          name="employmentType"
          label="Type of post"
          placeholder="Choose a type of post"
          options={toOptions(EMPLOYMENT_TYPE_LABELS)}
        />
        <DateField
          control={form.control}
          name="deadline"
          label="Last day to apply"
          description="Applications are accepted until the end of this day, Pakistan time."
        />
      </FieldGroup>
      <FieldGroup>
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          placeholder="What the role involves and its main duties"
          description={`The role and its duties. ${FORMATTED_TEXT_HINT}`}
          rows={12}
          maxLength={10_000}
        />
        <TextareaField
          control={form.control}
          name="requirements"
          label="Requirements"
          placeholder="Qualifications, experience and skills needed"
          description={`Optional. Qualifications and experience. ${FORMATTED_TEXT_HINT}`}
          rows={8}
          maxLength={5000}
        />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting}>
        {vacancyId ? "Save vacancy" : "Save draft"}
      </SaveButton>
    </form>
  );
}
