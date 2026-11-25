"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

interface DeleteProgramButtonProps {
  programId: string;
  title: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/** Deletes a program nobody applied to, after confirming. */
export function DeleteProgramButton({
  programId,
  title,
  isCompact = false,
}: DeleteProgramButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isCompact ? `Delete ${title}` : "Delete program"}
      title={`Delete “${title}”?`}
      description="The program and its photo are removed for good. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      icon={isCompact ? Trash2Icon : undefined}
      onConfirm={async () => {
        await apiDelete(`/programs/${programId}`);
        toast.success("Program deleted.");
        if (isCompact) {
          router.refresh();
        } else {
          router.push("/portal/programs");
        }
      }}
    />
  );
}
