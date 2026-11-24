"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { PORTAL_HOME_PATH } from "@/lib/constants/navigation";
import { signInSchema } from "@/lib/validations/auth";

type SignInValues = { email: string; password: string };

const RATE_LIMITED = 429;

function describeFailure(status: number, code: string | undefined): string {
  if (status === RATE_LIMITED) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (code === "BANNED_USER") {
    return "This account has been deactivated. Contact the administrator.";
  }
  // One message for a wrong email and a wrong password, so the form does not reveal which accounts exist.
  return "The email or password is not correct.";
}

export function SignInForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setFormError(describeFailure(error.status, error.code));
      return;
    }
    router.replace(PORTAL_HOME_PATH);
    router.refresh();
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
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
      />
      <TextField
        control={form.control}
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
      />
      <SaveButton
        isPending={form.formState.isSubmitting}
        pendingLabel="Signing in…"
        size="lg"
        className="w-full"
      >
        Sign in
      </SaveButton>
      <p className="text-center text-sm">
        <Link
          href="/portal/forgot-password"
          className="font-semibold text-navy underline underline-offset-2"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
