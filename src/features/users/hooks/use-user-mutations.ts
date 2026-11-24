"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError, apiPatch, apiPost } from "@/lib/api/client";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

/** After a save the list is read again from the server, and a toast says what happened. */
function useRefreshAfterSave() {
  const router = useRouter();
  return (message: string) => {
    toast.success(message);
    router.refresh();
  };
}

const describeError = (error: Error): string =>
  error instanceof ApiError ? error.message : "Something went wrong. Please try again.";

export function useCreateUser() {
  const onSaved = useRefreshAfterSave();
  return useMutation({
    mutationFn: (input: CreateUserInput) => apiPost("/users", input),
    onSuccess: () => {
      onSaved("User created. An invitation email was sent.");
    },
  });
}

export function useUpdateUser() {
  const onSaved = useRefreshAfterSave();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UpdateUserInput }) =>
      apiPatch(`/users/${id}`, changes),
    onSuccess: () => {
      onSaved("User updated.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: (id: string) => apiPost(`/users/${id}/reset-password`, {}),
    onSuccess: () => {
      toast.success("A password reset email was sent.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}
