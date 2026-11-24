import { TextField } from "@/components/forms/text-field";
import { FieldGroup } from "@/components/ui/field";
import type { ApplicationFormApi } from "@/features/applications/application-form-config";

export function StepEducation({ form }: { form: ApplicationFormApi }) {
  const { control } = form;
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="education.lastInstitution"
        label="Last institution attended"
      />
      <TextField control={control} name="education.classOrDegree" label="Class or degree" />
      <TextField control={control} name="education.boardOrUniversity" label="Board or university" />
      <TextField
        control={control}
        name="education.marksOrPercentage"
        label="Marks or percentage"
        description="For example 850/1100 or 77%."
      />
      <TextField
        control={control}
        name="education.passingYear"
        label="Passing year"
        type="number"
        inputMode="numeric"
      />
    </FieldGroup>
  );
}
