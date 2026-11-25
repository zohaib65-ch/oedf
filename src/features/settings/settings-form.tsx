"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useUpdateSettings } from "@/features/settings/hooks/use-settings-mutations";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import {
  updateSettingsSchema,
  type UpdateSettingsFormValues,
  type UpdateSettingsInput,
} from "@/lib/validations/settings";
import type { PublicSiteSettingsRecord } from "@/server/repositories/site-settings.repository";

const SOCIAL_FIELDS = [
  ["facebook", "Facebook", "https://www.facebook.com/…"],
  ["instagram", "Instagram", "https://www.instagram.com/…"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/company/…"],
  ["x", "X", "https://x.com/…"],
  ["youtube", "YouTube", "https://www.youtube.com/@…"],
] as const;

const MAX_IMPACT_NUMBERS = 8;

/** Contact details, social links, announcement bar, impact figures and the intake switches. */
export function SettingsForm({ settings }: { settings: PublicSiteSettingsRecord }) {
  const [formError, setFormError] = useState<string | undefined>();
  const save = useUpdateSettings();
  const form = useForm<UpdateSettingsFormValues, unknown, UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: settings,
  });
  const impact = useFieldArray({ control: form.control, name: "impactNumbers" });
  const knownFields = new Set(Object.keys(form.getValues()));

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await save.run(values);
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, knownFields));
    }
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>Shown in the site header, footer and contact page.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <TextareaField
              control={form.control}
              name="contact.address"
              label="Address"
              placeholder="Street, area and city"
              rows={3}
            />
            <TextField
              control={form.control}
              name="contact.phone"
              label="Phone"
              placeholder="+92 42 1234567"
              type="tel"
            />
            <TextField
              control={form.control}
              name="contact.email"
              label="General email"
              placeholder="info@example.com"
              type="email"
            />
            <TextField
              control={form.control}
              name="contact.officeHours"
              label="Office hours"
              placeholder="For example Mon–Fri, 9 am to 5 pm"
            />
            <TextField
              control={form.control}
              name="mapUrl"
              label="Map link"
              placeholder="https://maps.app.goo.gl/…"
              description="A Google Maps share link."
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
          <CardDescription>An icon shows in the footer only when its link is set.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {SOCIAL_FIELDS.map(([key, label, placeholder]) => (
              <TextField
                key={key}
                control={form.control}
                name={`social.${key}`}
                label={label}
                placeholder={placeholder}
              />
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Home page impact numbers</CardTitle>
          <CardDescription>
            Up to {MAX_IMPACT_NUMBERS} figures. Use real, current numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {impact.fields.map((item, index) => (
            <div key={item.id} className="flex flex-wrap items-start gap-3">
              <div className="min-w-48 flex-1">
                <TextField
                  control={form.control}
                  name={`impactNumbers.${index}.label`}
                  label="Label"
                  placeholder="For example Students supported"
                />
              </div>
              <div className="w-40">
                <TextField
                  control={form.control}
                  name={`impactNumbers.${index}.value`}
                  label="Number"
                  placeholder="For example 1200"
                  inputMode="numeric"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-7"
                aria-label={`Remove figure ${index + 1}`}
                onClick={() => {
                  impact.remove(index);
                }}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={impact.fields.length >= MAX_IMPACT_NUMBERS}
            onClick={() => {
              impact.append({ label: "", value: 0 });
            }}
          >
            <PlusIcon aria-hidden="true" />
            Add a figure
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcement bar</CardTitle>
          <CardDescription>A one-line notice above the header.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <CheckboxField control={form.control} name="announcement.isActive">
              Show the announcement bar
            </CheckboxField>
            <TextField
              control={form.control}
              name="announcement.text"
              label="Text"
              placeholder="For example Admissions for Fall 2026 are open"
            />
            <TextField
              control={form.control}
              name="announcement.linkUrl"
              label="Link"
              placeholder="For example /admissions"
              description="A page on this site (starting with /) or a full web address. Optional."
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intake</CardTitle>
          <CardDescription>
            Applications are accepted only while these are on. Turn them off to close an intake.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <CheckboxField control={form.control} name="admissionsOpen">
              Admissions are open
            </CheckboxField>
            <CheckboxField control={form.control} name="scholarshipsOpen">
              Scholarships are open
            </CheckboxField>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveButton isPending={form.formState.isSubmitting} size="lg">
        Save settings
      </SaveButton>
    </form>
  );
}
