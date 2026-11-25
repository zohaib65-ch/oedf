import { DateField } from "@/components/forms/date-field";
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
        placeholder="As written on your CNIC or B-Form"
        autoComplete="name"
      />
      <TextField
        control={control}
        name="applicant.guardianName"
        label="Father or guardian name"
        placeholder="Father's or guardian's full name"
      />
      <DateField control={control} name="applicant.dateOfBirth" label="Date of birth" />
      <SelectField
        control={control}
        name="applicant.gender"
        label="Gender"
        placeholder="Choose your gender"
        options={GENDER_OPTIONS}
      />
      <TextField
        control={control}
        name="applicant.cnic"
        label="CNIC or B-Form number"
        placeholder="35202-1234567-1"
        inputMode="numeric"
        description="13 digits, with or without dashes."
      />
      <TextField
        control={control}
        name="applicant.email"
        label="Email"
        placeholder="you@example.com"
        type="email"
        autoComplete="email"
        description="Your confirmation and reference number are sent here."
      />
      <TextField
        control={control}
        name="applicant.phone"
        label="Phone"
        placeholder="0300 1234567"
        type="tel"
        autoComplete="tel"
      />
      <TextField
        control={control}
        name="applicant.address"
        label="Address"
        placeholder="House, street and area"
        autoComplete="street-address"
      />
      <TextField
        control={control}
        name="applicant.city"
        label="City"
        placeholder="For example Lahore"
        autoComplete="address-level2"
      />
    </FieldGroup>
  );
}
