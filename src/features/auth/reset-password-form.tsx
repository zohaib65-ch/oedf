"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH, resetPasswordSchema } from "@/lib/validations/auth";

type ResetValues = { password: string; confirmPassword: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    setFormError(undefined);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setFormError("This link has expired or was already used. Ask for a new one.");
      return;
    }
    router.replace("/portal/sign-in?passwordSet=1");
  });

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <TextField
        control={form.control}
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <TextField
        control={form.control}
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
      />
      <SaveButton isPending={form.formState.isSubmitting} size="lg" className="w-full">
        Set password
      </SaveButton>
    </form>
  );
}
