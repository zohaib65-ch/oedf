"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";

/** Shows the server's message (or a general one) in a toast. */
export function toastApiError(error: unknown): void {
  toast.error(
    error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
  );
}

/** Wraps a save so a button can show it is running. Errors are thrown to the caller. */
export function useApiAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [isPending, setIsPending] = useState(false);
  const run = async (...args: TArgs): Promise<TResult> => {
    setIsPending(true);
    try {
      return await action(...args);
    } finally {
      setIsPending(false);
    }
  };
  return { run, isPending };
}
