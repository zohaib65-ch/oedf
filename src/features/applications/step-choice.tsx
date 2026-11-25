import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { FieldGroup } from "@/components/ui/field";
import type { ApplicationFormApi } from "@/features/applications/application-form-config";
import type { ApplicationProgramOption } from "@/server/repositories/program.repository";

export function StepChoice({
  form,
  programs,
}: {
  form: ApplicationFormApi;
  programs: readonly ApplicationProgramOption[];
}) {
  const { control } = form;
  return (
    <FieldGroup>
      {programs.length > 0 ? (
        <SelectField
          control={control}
          name="programId"
          label="Program"
          placeholder="Choose a program"
          options={programs.map((program) => ({ value: program.id, label: program.title }))}
        />
      ) : null}
      <TextField
        control={control}
        name="intakeSession"
        label="Intake session"
        placeholder="For example Fall 2026"
        description="The session you are applying for, for example Fall 2026."
        maxLength={50}
      />
    </FieldGroup>
  );
}
