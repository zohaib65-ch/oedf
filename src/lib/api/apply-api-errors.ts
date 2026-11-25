import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/lib/api/client";

/**
 * Puts the server's field messages next to the matching form fields. Returns a message for the
 * form as a whole when the failure is not about one visible field (or it is not an API error).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: ReadonlySet<string>,
): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }
  let hasUnshownField = false;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (knownFields.has(field) && messages[0]) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    } else {
      hasUnshownField = true;
    }
  }
  // A message about a field the visitor cannot see (the honeypot, for example) is shown above the form.
  return hasUnshownField || Object.keys(error.fieldErrors).length === 0
    ? error.message
    : "Please fix the highlighted fields and submit again.";
}
