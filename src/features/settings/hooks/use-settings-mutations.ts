"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiPatch } from "@/lib/api/client";
import { useApiAction } from "@/lib/api/use-api-action";
import type { UpdateDepartmentInput, UpdateSettingsInput } from "@/lib/validations/settings";

export function useUpdateSettings() {
  const router = useRouter();
  return useApiAction(async (input: UpdateSettingsInput) => {
    await apiPatch("/settings", input);
    toast.success("Settings saved. The public site now shows the changes.");
    router.refresh();
  });
}

export function useUpdateDepartment() {
  const router = useRouter();
  return useApiAction(async (id: string, changes: UpdateDepartmentInput) => {
    await apiPatch(`/departments/${id}`, changes);
    toast.success("Office saved.");
    router.refresh();
  });
}
