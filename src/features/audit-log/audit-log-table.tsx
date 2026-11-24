"use client";

import { DataTable, type DataTableColumn } from "@/components/portal/data-table";
import { formatDateTime } from "@/lib/format";
import type { AuditLogRecord } from "@/server/repositories/audit-log.repository";

const columns: DataTableColumn<AuditLogRecord>[] = [
  { id: "when", header: "When", cell: (entry) => formatDateTime(entry.createdAt) },
  { id: "who", header: "Who", cell: (entry) => entry.actorName },
  {
    id: "action",
    header: "Action",
    cell: (entry) => <code className="text-xs">{entry.action}</code>,
  },
  {
    id: "record",
    header: "Record",
    cell: (entry) => (
      <span>
        {entry.entityType}
        <span className="block text-xs text-muted-foreground">{entry.entityId}</span>
      </span>
    ),
  },
  {
    id: "details",
    header: "Details",
    cell: (entry) =>
      Object.entries(entry.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ") || "None",
  },
  { id: "ip", header: "IP address", cell: (entry) => entry.ipAddress },
];

export function AuditLogTable({ entries }: { entries: AuditLogRecord[] }) {
  return (
    <DataTable label="Audit log" columns={columns} rows={entries} getRowId={(entry) => entry.id} />
  );
}
