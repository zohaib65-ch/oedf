"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiPatch } from "@/lib/api/client";

interface ArchiveButtonProps {
  /** The record's API path, for example `/applications/{id}`; it takes `{ isArchived }`. */
  endpoint: string;
  isArchived: boolean;
}

/** Archives a record (nothing is ever deleted), or restores an archived one. */
export function ArchiveButton({ endpoint, isArchived }: ArchiveButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isArchived ? "Restore" : "Archive"}
      title={isArchived ? "Restore this application?" : "Archive this application?"}
      description={
        isArchived
          ? "It returns to the list of applications in progress and can be changed again."
          : "It leaves the list of applications in progress and cannot be changed until it is restored. Nothing is deleted."
      }
      variant="outline"
      onConfirm={async () => {
        await apiPatch(endpoint, { isArchived: !isArchived });
        toast.success(isArchived ? "Application restored." : "Application archived.");
        router.refresh();
      }}
    />
  );
}
