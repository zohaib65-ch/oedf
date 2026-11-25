import type { Metadata } from "next";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteMessageButton } from "@/features/message-inbox/delete-message-button";
import { MessageActions } from "@/features/message-inbox/message-actions";
import { MessageStatusBadge } from "@/features/message-inbox/message-status-badge";
import { MESSAGE_SUBJECT_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { getDepartments } from "@/server/services/department.service";
import { getMessage } from "@/server/services/message-inbox.service";

export const metadata: Metadata = { title: "Message" };

export default async function MessagePage({ params }: PageProps<"/portal/messages/[id]">) {
  const access = await checkPagePermission("messages:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { id } = await params;
  const [message, departments] = await Promise.all([
    orNotFound(getMessage(access.staff, id)),
    getDepartments(),
  ]);
  const subject = MESSAGE_SUBJECT_LABELS[message.subject];
  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(`Re: your message to OEDF (${subject})`)}`;

  return (
    <>
      <PageHeader
        title={`Message from ${message.name}`}
        description={`${subject}. Received ${formatDateTime(message.createdAt)}.`}
        actions={<MessageStatusBadge status={message.status} />}
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <MessageActions
          messageId={message.id}
          status={message.status}
          canManage={hasPermission(access.staff, "messages:manage")}
          replyHref={replyHref}
        />
        {hasPermission(access.staff, "messages:manage") &&
        hasPermission(access.staff, "content:delete") ? (
          <DeleteMessageButton messageId={message.id} senderName={message.name} />
        ) : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-words whitespace-pre-wrap">{message.message}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sender</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              columns={1}
              items={[
                { label: "Name", value: message.name },
                { label: "Email", value: message.email },
                { label: "Phone", value: message.phone || "Not given" },
                {
                  label: "Office",
                  value:
                    departments.find((department) => department.id === message.departmentId)
                      ?.name ?? "",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
