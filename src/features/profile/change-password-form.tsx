"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema, MIN_PASSWORD_LENGTH } from "@/lib/validations/auth";

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };
const EMPTY: PasswordValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      // Signing out every other device protects the account if the old password leaked.
      revokeOtherSessions: true,
    });
    if (error) {
      form.setError("currentPassword", { message: "The current password is not correct" });
      return;
    }
    toast.success("Your password was changed. Other devices were signed out.");
    form.reset(EMPTY);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use at least {MIN_PASSWORD_LENGTH} characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
          <TextField
            control={form.control}
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
          />
          <TextField
            control={form.control}
            name="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
          <SaveButton isPending={form.formState.isSubmitting}>Change password</SaveButton>
        </form>
      </CardContent>
    </Card>
  );
}
