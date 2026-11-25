"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

/** Deletes a program nobody applied to, after confirming. */
export function DeleteProgramButton({ programId, title }: { programId: string; title: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete program"
      title={`Delete “${title}”?`}
      description="The program and its photo are removed for good. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={async () => {
        await apiDelete(`/programs/${programId}`);
        toast.success("Program deleted.");
        router.push("/portal/programs");
      }}
    />
  );
}
