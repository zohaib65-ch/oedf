"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ErrorSummary } from "@/components/forms/error-summary";
import { FormSuccess } from "@/components/forms/form-success";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPost } from "@/lib/api/client";
import { MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import { MESSAGE_SUBJECT_LABELS } from "@/lib/constants/labels";
import { contactMessageSchema, type ContactMessageInput } from "@/lib/validations/contact";

const LABELS = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  subject: "Subject",
  message: "Message",
};
const KNOWN_FIELDS = new Set(Object.keys(LABELS));
const SUBJECT_OPTIONS = MESSAGE_SUBJECTS.map((value) => ({
  value,
  label: MESSAGE_SUBJECT_LABELS[value],
}));

export function ContactForm() {
  const form = useForm<z.input<typeof contactMessageSchema>, unknown, ContactMessageInput>({
    // The error summary takes focus instead of the first invalid field, so a screen reader hears every problem.
    shouldFocusError: false,
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: undefined,
      message: "",
      faxNumber: "",
    },
  });
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [focusKey, setFocusKey] = useState(0);

  const handleSubmit = form.handleSubmit(
    async (values) => {
      setFormError(undefined);
      try {
        await apiPost("/contact-messages", values);
        setIsSent(true);
      } catch (error: unknown) {
        setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
        setFocusKey((key) => key + 1);
      }
    },
    () => {
      setFocusKey((key) => key + 1);
    },
  );

  if (isSent) {
    return (
      <FormSuccess title="Message sent">
        Thank you. We have received your message and will reply as soon as we can.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="relative space-y-6">
      <ErrorSummary errors={form.formState.errors} labels={LABELS} focusKey={focusKey} />
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="name" />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
        />
        <SelectField
          control={form.control}
          name="subject"
          label="Subject"
          options={SUBJECT_OPTIONS}
        />
        <TextareaField control={form.control} name="message" label="Message" />
      </FieldGroup>
      <HoneypotField register={form.register} />
      <SubmitButton isSubmitting={form.formState.isSubmitting}>Send message</SubmitButton>
    </form>
  );
}
