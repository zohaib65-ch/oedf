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
        placeholder="Name of your school, college or university"
      />
      <TextField
        control={control}
        name="education.classOrDegree"
        label="Class or degree"
        placeholder="For example Intermediate (FSc)"
      />
      <TextField
        control={control}
        name="education.boardOrUniversity"
        label="Board or university"
        placeholder="For example BISE Lahore"
      />
      <TextField
        control={control}
        name="education.marksOrPercentage"
        label="Marks or percentage"
        placeholder="850/1100 or 77%"
        description="For example 850/1100 or 77%."
      />
      <TextField
        control={control}
        name="education.passingYear"
        label="Passing year"
        placeholder="For example 2025"
        type="number"
        inputMode="numeric"
      />
    </FieldGroup>
  );
}
