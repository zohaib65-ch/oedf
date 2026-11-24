"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiPatch, apiPost } from "@/lib/api/client";
import { useApiAction } from "@/lib/api/use-api-action";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

export function useCreateUser() {
  const router = useRouter();
  return useApiAction(async (input: CreateUserInput) => {
    await apiPost("/users", input);
    toast.success("User created. An invitation email was sent.");
    router.refresh();
  });
}

export function useUpdateUser() {
  const router = useRouter();
  return useApiAction(async (id: string, changes: UpdateUserInput) => {
    await apiPatch(`/users/${id}`, changes);
    toast.success("User updated.");
    router.refresh();
  });
}

export function useSendPasswordReset() {
  return useApiAction(async (id: string) => {
    await apiPost(`/users/${id}/reset-password`, {});
    toast.success("A password reset email was sent.");
  });
}
