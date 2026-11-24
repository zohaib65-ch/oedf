import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your staff email and we will send you a link to choose a new one."
      footerLink={{ href: "/portal/sign-in", label: "Back to sign in" }}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
