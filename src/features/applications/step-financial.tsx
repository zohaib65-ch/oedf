import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { UploadField } from "@/components/forms/upload-field";
import { FieldGroup } from "@/components/ui/field";
import type { ApplicationFormApi } from "@/features/applications/application-form-config";

export function StepFinancial({ form }: { form: ApplicationFormApi }) {
  const { control } = form;
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="financial.monthlyIncomePkr"
        label="Monthly household income (PKR)"
        type="number"
        inputMode="numeric"
        description="Whole rupees."
      />
      <TextField
        control={control}
        name="financial.familySize"
        label="Number of people in the family"
        type="number"
        inputMode="numeric"
      />
      <TextField
        control={control}
        name="financial.guardianOccupation"
        label="Guardian's occupation"
      />
      <TextField
        control={control}
        name="financial.otherSupport"
        label="Other support received (optional)"
        description="Any other scholarship or financial help."
      />
      <TextareaField
        control={control}
        name="financial.statementOfNeed"
        label="Statement of need"
        description="Tell us why you need financial support."
        rows={6}
      />
      <UploadField
        control={control}
        name="documents.incomeProof"
        label="Proof of income"
        purpose="APPLICATION_DOCUMENT"
      />
    </FieldGroup>
  );
}
