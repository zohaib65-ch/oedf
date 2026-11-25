"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { DeleteMessageButton } from "@/features/message-inbox/delete-message-button";
import { MessageStatusBadge } from "@/features/message-inbox/message-status-badge";
import { MESSAGE_SUBJECT_LABELS } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { MessageListItem } from "@/server/repositories/contact-message.repository";

export interface MessageRow extends MessageListItem {
  officeName: string;
}

const deleteColumn: DataTableColumn<MessageRow> = {
  id: "actions",
  header: "Actions",
  isActions: true,
  cell: (message) => (
    <DeleteMessageButton messageId={message.id} senderName={message.name} isCompact />
  ),
};

function buildColumns(showOffice: boolean, canDelete: boolean): DataTableColumn<MessageRow>[] {
  return [
    {
      id: "received",
      header: "Received",
      sortKey: "createdAt",
      cell: (message) => formatDateTime(message.createdAt),
    },
    {
      id: "name",
      header: "From",
      sortKey: "name",
      cell: (message) => (
        <Link
          href={`/portal/messages/${message.id}`}
          className={
            message.status === "NEW"
              ? "font-bold text-navy underline underline-offset-2"
              : "text-navy underline underline-offset-2"
          }
        >
          {message.name}
        </Link>
      ),
    },
    { id: "email", header: "Email", cell: (message) => message.email },
    {
      id: "subject",
      header: "Subject",
      cell: (message) => MESSAGE_SUBJECT_LABELS[message.subject],
    },
    ...(showOffice
      ? [{ id: "office", header: "Office", cell: (message: MessageRow) => message.officeName }]
      : []),
    {
      id: "status",
      header: "Status",
      cell: (message) => <MessageStatusBadge status={message.status} />,
    },
    ...(canDelete ? [deleteColumn] : []),
  ];
}

interface MessagesTableProps {
  messages: MessageRow[];
  sorting: DataTableSorting;
  /** Super Admin and the CEO Office see every office's messages, so the office is shown. */
  showOffice: boolean;
  /** May delete messages (`messages:manage` and `content:delete`). */
  canDelete: boolean;
}

export function MessagesTable({ messages, sorting, showOffice, canDelete }: MessagesTableProps) {
  return (
    <DataTable
      label="Messages"
      columns={buildColumns(showOffice, canDelete)}
      rows={messages}
      getRowId={(message) => message.id}
      sorting={sorting}
    />
  );
}
