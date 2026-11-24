"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useUpdateDepartment } from "@/features/settings/hooks/use-settings-mutations";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { departmentFieldsSchema, type DepartmentFields } from "@/lib/validations/settings";
import type { StaffDepartmentRecord } from "@/server/repositories/department.repository";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["directorName", "notificationEmail"]);

function OfficeForm({ office }: { office: StaffDepartmentRecord }) {
  const [formError, setFormError] = useState<string | undefined>();
  const save = useUpdateDepartment();
  const form = useForm<DepartmentFields>({
    resolver: zodResolver(departmentFieldsSchema),
    defaultValues: {
      directorName: office.directorName,
      notificationEmail: office.notificationEmail,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await save.run(office.id, values);
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      aria-label={office.name}
      className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0"
    >
      <h3 className="font-semibold">{office.name}</h3>
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="sm:grid sm:grid-cols-2">
        <TextField control={form.control} name="directorName" label="Director's name" />
        <TextField
          control={form.control}
          name="notificationEmail"
          label="Notification email"
          type="email"
          description="Contact messages for this office are sent here."
        />
      </FieldGroup>
      <SaveButton isPending={form.formState.isSubmitting} variant="outline">
        Save {office.name}
      </SaveButton>
    </form>
  );
}

/** One small form per office, so each can be saved on its own. */
export function OfficesForm({ offices }: { offices: StaffDepartmentRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Offices</CardTitle>
        <CardDescription>
          Each office&rsquo;s director and the email that receives its contact messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {offices.map((office) => (
          <OfficeForm key={office.id} office={office} />
        ))}
      </CardContent>
    </Card>
  );
}
