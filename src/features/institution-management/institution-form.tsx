"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ImageFields } from "@/components/portal/image-fields";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { WebsiteVisibilityField } from "@/features/institution-management/website-visibility-field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import {
  INSTITUTION_STATUS_LABELS,
  INSTITUTION_TYPE_LABELS,
  toOptions,
} from "@/lib/constants/labels";
import { FORMATTED_TEXT_HINT } from "@/lib/formatted-text";
import {
  institutionFormSchema,
  type InstitutionFormInput,
  type InstitutionFormValues,
} from "@/lib/validations/institution";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "name",
  "type",
  "city",
  "address",
  "description",
  "status",
  "isPublic",
  "image",
  "imageAlt",
]);

interface InstitutionFormProps {
  /** The institution being edited, or nothing for a new one. */
  institutionId?: string;
  defaultValues: Partial<InstitutionFormValues>;
  /** Only someone who may publish can show the institution on the public site. */
  canPublish: boolean;
  currentImage?: { url: string; width: number; height: number; alt: string } | null;
}

export function InstitutionForm({
  institutionId,
  defaultValues,
  canPublish,
  currentImage,
}: InstitutionFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  /** A new institution's checked values, held while the website question is open. */
  const [pendingValues, setPendingValues] = useState<InstitutionFormInput | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<InstitutionFormValues, unknown, InstitutionFormInput>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues,
  });
  // A new institution is always asked about the website; editing uses the box in the form.
  const asksAboutWebsite = !institutionId && canPublish;

  const save = async (values: InstitutionFormInput) => {
    setFormError(undefined);
    setIsSaving(true);
    try {
      if (institutionId) {
        await apiPatch(`/institutions/${institutionId}`, values);
        toast.success("Institution saved.");
        router.refresh();
      } else {
        const created = await apiPost<{ id: string }>("/institutions", values);
        toast.success("Institution saved.");
        router.push(`/portal/institutions/${created.id}`);
      }
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    } finally {
      setIsSaving(false);
      setPendingValues(null);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (asksAboutWebsite) {
      setPendingValues(values);
      return;
    }
    await save(values);
  });

  const answer = (isPublic: boolean) => {
    if (pendingValues) {
      form.setValue("isPublic", isPublic);
      void save({ ...pendingValues, isPublic });
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <TextField
          control={form.control}
          name="name"
          label="Name"
          placeholder="Full name of the institution"
          maxLength={150}
        />
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          placeholder="Choose a type"
          options={toOptions(INSTITUTION_TYPE_LABELS)}
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
          name="status"
          label="Status"
          placeholder="Choose a status"
          options={toOptions(INSTITUTION_STATUS_LABELS)}
        />
      </FieldGroup>
      {asksAboutWebsite ? null : (
        <WebsiteVisibilityField control={form.control} canPublish={canPublish} />
      )}
      <FieldGroup>
        <TextField
          control={form.control}
          name="address"
          label="Address"
          placeholder="Street address"
          description="Optional."
          maxLength={300}
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          placeholder="About the institution and its work"
          description={`Optional. ${FORMATTED_TEXT_HINT}`}
          rows={8}
          maxLength={10_000}
        />
        <ImageFields control={form.control} currentImage={currentImage ?? null} />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting || isSaving}>Save institution</SaveButton>
      <AlertDialog
        open={pendingValues !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isSaving) {
            setPendingValues(null);
          }
        }}
      >
        <AlertDialogContent className="data-[size=default]:sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Show “{pendingValues?.name}” on the website?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValues?.status === "ACTIVE"
                ? "If yes, visitors see it on the Institutions page and the home page as soon as it is saved."
                : "If yes, it shows on the website once its status is Active."}{" "}
              You can change this later on the institution’s page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-wrap">
            <AlertDialogCancel disabled={isSaving}>Back to the form</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                answer(false);
              }}
            >
              No, keep it hidden
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => {
                answer(true);
              }}
            >
              Yes, show it
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
