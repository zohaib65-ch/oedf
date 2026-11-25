"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { DeleteApplicationButton } from "@/features/application-review/delete-application-button";
import { applicationStatusTone } from "@/lib/constants/application-workflow";
import { APPLICATION_STATUS_LABELS, APPLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { ApplicationListItem } from "@/server/repositories/application-review.repository";

const columns: DataTableColumn<ApplicationListItem>[] = [
  {
    id: "reference",
    header: "Reference",
    sortKey: "referenceNumber",
    cell: (application) => (
      <Link
        href={`/portal/applications/${application.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {application.referenceNumber}
      </Link>
    ),
  },
  {
    id: "name",
    header: "Applicant",
    sortKey: "name",
    cell: (application) => application.applicantName,
  },
  { id: "cnic", header: "CNIC", cell: (application) => `…${application.cnicLast4}` },
  { id: "type", header: "Type", cell: (application) => APPLICATION_TYPE_LABELS[application.type] },
  { id: "program", header: "Program", cell: (application) => application.programTitle ?? "None" },
  { id: "city", header: "City", cell: (application) => application.city },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (application) => (
      <StatusBadge
        label={APPLICATION_STATUS_LABELS[application.status]}
        tone={applicationStatusTone(application.status)}
      />
    ),
  },
  {
    id: "submitted",
    header: "Submitted",
    sortKey: "createdAt",
    cell: (application) => formatDateTime(application.createdAt),
  },
];

const deleteColumn: DataTableColumn<ApplicationListItem> = {
  id: "actions",
  header: "Actions",
  isActions: true,
  cell: (application) => (
    <DeleteApplicationButton
      applicationId={application.id}
      referenceNumber={application.referenceNumber}
      isCompact
    />
  ),
};

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  sorting: DataTableSorting;
  /** May delete applications (`applications:decide` and `content:delete`). */
  canDelete: boolean;
}

export function ApplicationsTable({ applications, sorting, canDelete }: ApplicationsTableProps) {
  return (
    <DataTable
      label="Applications"
      columns={canDelete ? [...columns, deleteColumn] : columns}
      rows={applications}
      getRowId={(application) => application.id}
      sorting={sorting}
    />
  );
}
