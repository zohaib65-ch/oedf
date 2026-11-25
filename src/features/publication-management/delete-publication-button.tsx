"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

/** Deletes a publication after confirming. Only Directors see it. */
export function DeletePublicationButton({
  publicationId,
  title,
}: {
  publicationId: string;
  title: string;
}) {
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete publication"
      title={`Delete “${title}”?`}
      description="The publication, its PDF and its cover are removed for good, and its public page stops working. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={async () => {
        await apiDelete(`/publications/${publicationId}`);
        toast.success("Publication deleted.");
        router.push("/portal/publications");
      }}
    />
  );
}
