import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/auth-card";
import { PasswordSetNotice } from "@/features/auth/password-set-notice";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard title="Staff sign in" description="Sign in to the OEDF staff portal.">
      <Suspense>
        <PasswordSetNotice />
      </Suspense>
      <SignInForm />
    </AuthCard>
  );
}
