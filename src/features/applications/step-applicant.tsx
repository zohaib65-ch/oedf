import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { FieldGroup } from "@/components/ui/field";
import type { ApplicationFormApi } from "@/features/applications/application-form-config";
import { GENDERS } from "@/lib/constants/enums";
import { GENDER_LABELS } from "@/lib/constants/labels";

const GENDER_OPTIONS = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

export function StepApplicant({ form }: { form: ApplicationFormApi }) {
  const { control } = form;
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="applicant.fullName"
        label="Full name"
        autoComplete="name"
      />
      <TextField control={control} name="applicant.guardianName" label="Father or guardian name" />
      <TextField
        control={control}
        name="applicant.dateOfBirth"
        label="Date of birth"
        type="date"
        autoComplete="bday"
      />
      <SelectField
        control={control}
        name="applicant.gender"
        label="Gender"
        options={GENDER_OPTIONS}
      />
      <TextField
        control={control}
        name="applicant.cnic"
        label="CNIC or B-Form number"
        inputMode="numeric"
        description="13 digits, with or without dashes."
      />
      <TextField
        control={control}
        name="applicant.email"
        label="Email"
        type="email"
        autoComplete="email"
        description="Your confirmation and reference number are sent here."
      />
      <TextField
        control={control}
        name="applicant.phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
      />
      <TextField
        control={control}
        name="applicant.address"
        label="Address"
        autoComplete="street-address"
      />
      <TextField
        control={control}
        name="applicant.city"
        label="City"
        autoComplete="address-level2"
      />
    </FieldGroup>
  );
}
