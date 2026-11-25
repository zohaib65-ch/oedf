"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { apiDelete } from "@/lib/api/client";

interface DeleteMessageButtonProps {
  messageId: string;
  senderName: string;
  /** In a table row: a trash icon, and the list reloads in place after deleting. */
  isCompact?: boolean;
}

/** Deletes a contact message after confirming. Directors, the CEO Office and Super Admin see it. */
export function DeleteMessageButton({
  messageId,
  senderName,
  isCompact = false,
}: DeleteMessageButtonProps) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={isCompact ? `Delete the message from ${senderName}` : "Delete message"}
      title={`Delete the message from ${senderName}?`}
      description="The message is removed from the inbox for good. This is recorded in the audit log."
      confirmLabel="Delete"
      variant="destructive"
      icon={isCompact ? Trash2Icon : undefined}
      onConfirm={async () => {
        await apiDelete(`/contact-messages/${messageId}`);
        toast.success("Message deleted.");
        if (isCompact) {
          router.refresh();
        } else {
          router.push("/portal/messages");
        }
      }}
    />
  );
}
