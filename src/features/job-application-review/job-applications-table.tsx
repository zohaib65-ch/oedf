"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { jobApplicationStatusTone } from "@/lib/constants/job-application-workflow";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { JobApplicationListItem } from "@/server/repositories/job-application-review.repository";

const columns: DataTableColumn<JobApplicationListItem>[] = [
  {
    id: "reference",
    header: "Reference",
    sortKey: "referenceNumber",
    cell: (application) => (
      <Link
        href={`/portal/job-applications/${application.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {application.referenceNumber}
      </Link>
    ),
  },
  {
    id: "name",
    header: "Candidate",
    sortKey: "name",
    cell: (application) => application.candidateName,
  },
  { id: "cnic", header: "CNIC", cell: (application) => `…${application.cnicLast4}` },
  {
    id: "vacancy",
    header: "Vacancy",
    cell: (application) => application.vacancyTitle ?? "Deleted vacancy",
  },
  { id: "city", header: "City", cell: (application) => application.city },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (application) => (
      <StatusBadge
        label={JOB_APPLICATION_STATUS_LABELS[application.status]}
        tone={jobApplicationStatusTone(application.status)}
      />
    ),
  },
  {
    id: "interview",
    header: "Interview",
    sortKey: "interviewAt",
    cell: (application) =>
      application.interviewAt ? formatDateTime(application.interviewAt) : "Not set",
  },
  {
    id: "received",
    header: "Received",
    sortKey: "createdAt",
    cell: (application) => formatDateTime(application.createdAt),
  },
];

interface JobApplicationsTableProps {
  applications: JobApplicationListItem[];
  sorting: DataTableSorting;
}

export function JobApplicationsTable({ applications, sorting }: JobApplicationsTableProps) {
  return (
    <DataTable
      label="Job applications"
      columns={columns}
      rows={applications}
      getRowId={(application) => application.id}
      sorting={sorting}
    />
  );
}
