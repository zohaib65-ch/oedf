"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { UploadField } from "@/components/forms/upload-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import { AGREEMENT_STATUS_LABELS, toOptions } from "@/lib/constants/labels";
import { agreementFormSchema, type AgreementFormInput } from "@/lib/validations/institution";
import type { AgreementRecord } from "@/server/repositories/institution-management.repository";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "title",
  "partner",
  "startDate",
  "endDate",
  "renewalDate",
  "status",
  "document",
]);

interface AgreementDialogProps {
  institutionId: string;
  /** The agreement to edit, or nothing to add one. */
  agreement?: AgreementRecord;
}

/** Adds or edits an agreement, with an optional signed copy (a private PDF). */
export function AgreementDialog({ institutionId, agreement }: AgreementDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<AgreementFormInput>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: {
      title: agreement?.title ?? "",
      partner: agreement?.partner ?? "",
      startDate: agreement?.startDate ?? "",
      endDate: agreement?.endDate ?? "",
      renewalDate: agreement?.renewalDate ?? "",
      status: agreement?.status ?? "DRAFT",
      document: agreement?.document
        ? {
            publicId: agreement.document.publicId,
            resourceType: "image",
            originalName: agreement.document.originalName,
          }
        : undefined,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (agreement) {
        await apiPatch(`/institutions/${institutionId}/agreements/${agreement.id}`, values);
      } else {
        await apiPost(`/institutions/${institutionId}/agreements`, values);
        form.reset();
      }
      toast.success("Agreement saved.");
      setIsOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  const title = agreement ? "Edit agreement" : "Add agreement";
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={agreement ? "outline" : "default"} size={agreement ? "sm" : "default"}>
          {agreement ? (
            <>
              Edit<span className="sr-only"> {agreement.title}</span>
            </>
          ) : (
            title
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-svh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            The signed copy stays private: staff open it through a link that lasts five minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
          {formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <TextField
              control={form.control}
              name="title"
              label="Title"
              placeholder="For example Scholarship partnership agreement"
              maxLength={150}
            />
            <TextField
              control={form.control}
              name="partner"
              label="Partner"
              placeholder="Name of the partner organization"
              maxLength={150}
            />
            <DateField control={form.control} name="startDate" label="Start date" />
            <DateField
              control={form.control}
              name="endDate"
              label="End date"
              description="Optional."
            />
            <DateField
              control={form.control}
              name="renewalDate"
              label="Renewal date"
              description="Optional. Listed on the institutions page as the next renewal."
            />
            <SelectField
              control={form.control}
              name="status"
              label="Status"
              placeholder="Choose a status"
              options={toOptions(AGREEMENT_STATUS_LABELS)}
            />
            <UploadField
              control={form.control}
              name="document"
              label="Signed copy"
              purpose="AGREEMENT"
              description="Optional. PDF, up to 5 MB."
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <SaveButton isPending={form.formState.isSubmitting}>Save agreement</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
