"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

interface DeleteInstitutionButtonProps {
  institutionId: string;
  name: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/** Deletes an institution without agreements or reviews, after confirming. */
export function DeleteInstitutionButton({
  institutionId,
  name,
  isCompact = false,
}: DeleteInstitutionButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isCompact ? `Delete ${name}` : "Delete institution"}
      title={`Delete “${name}”?`}
      description="The institution and its photo are removed for good, and programs that list it no longer do. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      icon={isCompact ? Trash2Icon : undefined}
      onConfirm={async () => {
        await apiDelete(`/institutions/${institutionId}`);
        toast.success("Institution deleted.");
        if (isCompact) {
          router.refresh();
        } else {
          router.push("/portal/institutions");
        }
      }}
    />
  );
}
