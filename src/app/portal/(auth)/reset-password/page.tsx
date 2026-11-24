import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/auth-card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Set your password" };

async function ResetPasswordContent({
  searchParams,
}: Pick<PageProps<"/portal/reset-password">, "searchParams">) {
  const { token, invited } = await searchParams;
  const resetToken = typeof token === "string" ? token : undefined;
  return (
    <AuthCard
      title={invited ? "Welcome to the portal" : "Choose a new password"}
      description={
        invited
          ? "Set a password to finish creating your account."
          : "Choose a new password for your staff account."
      }
      footerLink={{ href: "/portal/sign-in", label: "Back to sign in" }}
    >
      {resetToken ? (
        <ResetPasswordForm token={resetToken} />
      ) : (
        <p role="alert" className="text-destructive">
          This link is not valid or has expired. Use &ldquo;Forgot your password?&rdquo; to get a
          new one.
        </p>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/portal/reset-password">) {
  return (
    <Suspense>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
