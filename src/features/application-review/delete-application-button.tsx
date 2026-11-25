"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

interface DeleteApplicationButtonProps {
  applicationId: string;
  referenceNumber: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/** Deletes an application and its documents after confirming. Only those who decide applications see it. */
export function DeleteApplicationButton({
  applicationId,
  referenceNumber,
  isCompact = false,
}: DeleteApplicationButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isCompact ? `Delete application ${referenceNumber}` : "Delete application"}
      title={`Delete application ${referenceNumber}?`}
      description="The application, its notes and its uploaded documents are removed for good, and the applicant can no longer check its status. An application with a scholarship award cannot be deleted. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      icon={isCompact ? Trash2Icon : undefined}
      onConfirm={async () => {
        await apiDelete(`/applications/${applicationId}`);
        toast.success("Application deleted.");
        if (isCompact) {
          router.refresh();
        } else {
          router.push("/portal/applications");
        }
      }}
    />
  );
}
