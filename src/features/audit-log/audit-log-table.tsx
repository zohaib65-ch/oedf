"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/portal/data-table";
import { formatDateTime } from "@/lib/format";
import type { AuditLogRecord } from "@/server/repositories/audit-log.repository";

const columns: ColumnDef<AuditLogRecord>[] = [
  { id: "when", header: "When", cell: ({ row }) => formatDateTime(row.original.createdAt) },
  { accessorKey: "actorName", header: "Who" },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <code className="text-xs">{row.original.action}</code>,
  },
  {
    id: "record",
    header: "Record",
    cell: ({ row }) => (
      <span>
        {row.original.entityType}
        <span className="block text-xs text-muted-foreground">{row.original.entityId}</span>
      </span>
    ),
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) =>
      Object.entries(row.original.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ") || "None",
  },
  { accessorKey: "ipAddress", header: "IP address" },
];

export function AuditLogTable({ entries }: { entries: AuditLogRecord[] }) {
  return (
    <DataTable label="Audit log" columns={columns} rows={entries} getRowId={(entry) => entry.id} />
  );
}
