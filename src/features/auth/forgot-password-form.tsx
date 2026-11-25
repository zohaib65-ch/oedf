"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = form.handleSubmit(async ({ email }) => {
    setFormError(undefined);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/portal/reset-password",
    });
    if (error) {
      setFormError("We could not send the email. Wait a minute and try again.");
      return;
    }
    setIsSent(true);
  });

  if (isSent) {
    return (
      <Alert role="status">
        <AlertDescription>
          If an active account uses that email, a link to choose a new password is on its way. It
          works for 24 hours.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <TextField
        control={form.control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        type="email"
        autoComplete="username"
      />
      <SaveButton
        isPending={form.formState.isSubmitting}
        pendingLabel="Sending…"
        size="lg"
        className="w-full"
      >
        Send reset link
      </SaveButton>
    </form>
  );
}
