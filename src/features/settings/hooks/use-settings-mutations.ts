"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiPatch } from "@/lib/api/client";
import type { UpdateDepartmentInput, UpdateSettingsInput } from "@/lib/validations/settings";

export function useUpdateSettings() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => apiPatch("/settings", input),
    onSuccess: () => {
      toast.success("Settings saved. The public site now shows the changes.");
      router.refresh();
    },
  });
}

export function useUpdateDepartment() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UpdateDepartmentInput }) =>
      apiPatch(`/departments/${id}`, changes),
    onSuccess: () => {
      toast.success("Office saved.");
      router.refresh();
    },
  });
}
