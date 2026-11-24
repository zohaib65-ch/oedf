import { UploadField } from "@/components/forms/upload-field";
import { FieldGroup } from "@/components/ui/field";
import type { ApplicationFormApi } from "@/features/applications/application-form-config";

export function StepDocuments({ form }: { form: ApplicationFormApi }) {
  const { control } = form;
  return (
    <FieldGroup>
      <UploadField
        control={control}
        name="documents.photo"
        label="Photograph"
        purpose="APPLICATION_DOCUMENT"
        description="A recent passport-size photograph. PDF, JPG or PNG, up to 5 MB."
      />
      <UploadField
        control={control}
        name="documents.identity"
        label="CNIC or B-Form copy"
        purpose="APPLICATION_DOCUMENT"
      />
      <UploadField
        control={control}
        name="documents.resultCard"
        label="Latest result card"
        purpose="APPLICATION_DOCUMENT"
      />
    </FieldGroup>
  );
}
