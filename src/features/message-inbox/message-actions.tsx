"use client";

import { MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiPatch } from "@/lib/api/client";
import { toastApiError, useApiAction } from "@/lib/api/use-api-action";
import type { MESSAGE_STATUSES } from "@/lib/constants/enums";

type MessageStatus = (typeof MESSAGE_STATUSES)[number];

const ACTIONS: { status: MessageStatus; label: string; done: string }[] = [
  { status: "REPLIED", label: "Mark as replied", done: "Marked as replied." },
  { status: "ARCHIVED", label: "Archive", done: "Message archived." },
  { status: "NEW", label: "Mark as unread", done: "Marked as unread." },
];

interface MessageActionsProps {
  messageId: string;
  status: MessageStatus;
  canManage: boolean;
  /** A `mailto:` link with the sender's address and a "Re:" subject. */
  replyHref: string;
}

/**
 * "Reply by email" opens the person's mail app; the status buttons keep the inbox tidy. A new
 * message is marked as read once it is opened.
 */
export function MessageActions({ messageId, status, canManage, replyHref }: MessageActionsProps) {
  const router = useRouter();
  const hasMarkedRead = useRef(false);
  const { run, isPending } = useApiAction(async (next: MessageStatus) => {
    await apiPatch(`/contact-messages/${messageId}`, { status: next });
  });

  useEffect(() => {
    if (!canManage || status !== "NEW" || hasMarkedRead.current) {
      return;
    }
    hasMarkedRead.current = true;
    run("READ")
      .then(() => {
        router.refresh();
      })
      .catch(toastApiError);
    // The ref keeps this to one request, however often the effect runs.
  }, [canManage, status, run, router]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={replyHref}>
          <MailIcon aria-hidden="true" />
          Reply by email
        </a>
      </Button>
      {canManage
        ? ACTIONS.filter((action) => action.status !== status).map((action) => (
            <Button
              key={action.status}
              variant="outline"
              disabled={isPending}
              onClick={() => {
                run(action.status)
                  .then(() => {
                    toast.success(action.done);
                    router.refresh();
                  })
                  .catch(toastApiError);
              }}
            >
              {action.label}
            </Button>
          ))
        : null}
    </div>
  );
}
