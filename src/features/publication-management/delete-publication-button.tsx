"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

interface DeletePublicationButtonProps {
  publicationId: string;
  title: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/** Deletes a publication after confirming. Only Directors see it. */
export function DeletePublicationButton({
  publicationId,
  title,
  isCompact = false,
}: DeletePublicationButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isCompact ? `Delete ${title}` : "Delete publication"}
      title={`Delete “${title}”?`}
      description="The publication, its PDF and its cover are removed for good, and its public page stops working. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      icon={isCompact ? Trash2Icon : undefined}
      onConfirm={async () => {
        await apiDelete(`/publications/${publicationId}`);
        toast.success("Publication deleted.");
        if (isCompact) {
          router.refresh();
        } else {
          router.push("/portal/publications");
        }
      }}
    />
  );
}
