"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

/** Deletes a news post or event after confirming. */
export function DeleteNewsButton({ postId, title }: { postId: string; title: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete post"
      title={`Delete “${title}”?`}
      description="The post and its cover are removed for good, and its public page stops working. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={async () => {
        await apiDelete(`/news/${postId}`);
        toast.success("Post deleted.");
        router.push("/portal/news");
      }}
    />
  );
}
