"use client";

import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";

/** Confirms a new password after the reset page sent the person here. Read in the browser, so the page stays static. */
export function PasswordSetNotice() {
  const searchParams = useSearchParams();
  if (!searchParams.get("passwordSet")) {
    return null;
  }
  return (
    <Alert role="status">
      <AlertDescription>Your password is set. Sign in to continue.</AlertDescription>
    </Alert>
  );
}
