"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DateField } from "@/components/forms/date-field";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch } from "@/lib/api/client";
import { AWARD_PERIOD_LABELS, AWARD_STATUS_LABELS, toOptions } from "@/lib/constants/labels";
import {
  awardFormSchema,
  type AwardFormInput,
  type AwardFormValues,
} from "@/lib/validations/application-review";
import type { AwardDetail } from "@/server/repositories/scholarship-award.repository";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "amountPkr",
  "period",
  "startDate",
  "renewalDate",
  "status",
]);

/** The award's terms and status. A record only: no payment is made or tracked here. */
export function AwardForm({ award }: { award: AwardDetail }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<AwardFormValues, unknown, AwardFormInput>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: {
      amountPkr: award.amountPkr,
      period: award.period,
      startDate: award.startDate,
      renewalDate: award.renewalDate ?? "",
      status: award.status,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await apiPatch(`/scholarship-awards/${award.id}`, values);
      toast.success("Award saved.");
      router.refresh();
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
          name="amountPkr"
          label="Amount (whole rupees)"
          placeholder="For example 25000"
          inputMode="numeric"
        />
        <SelectField
          control={form.control}
          name="period"
          label="Paid"
          placeholder="Choose how often it is paid"
          options={toOptions(AWARD_PERIOD_LABELS)}
        />
        <DateField control={form.control} name="startDate" label="Start date" />
        <DateField
          control={form.control}
          name="renewalDate"
          label="Renewal date"
          description="Optional. Leave empty when there is none."
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          placeholder="Choose a status"
          options={toOptions(AWARD_STATUS_LABELS)}
        />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting}>Save award</SaveButton>
    </form>
  );
}
