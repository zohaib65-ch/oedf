"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { CONTENT_STATUS_LABELS, PROGRAM_CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { StaffProgramListItem } from "@/server/repositories/program-management.repository";

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;

const columns: DataTableColumn<StaffProgramListItem>[] = [
  {
    id: "title",
    header: "Title",
    sortKey: "title",
    cell: (program) => (
      <Link
        href={`/portal/programs/${program.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {program.title}
      </Link>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: (program) => PROGRAM_CATEGORY_LABELS[program.category],
  },
  {
    id: "status",
    header: "Status",
    cell: (program) => (
      <StatusBadge label={CONTENT_STATUS_LABELS[program.status]} tone={TONE[program.status]} />
    ),
  },
  {
    id: "applications",
    header: "Takes applications",
    cell: (program) => (program.acceptsApplications ? "Yes" : "No"),
  },
  { id: "institutions", header: "Institutions", cell: (program) => program.institutionCount },
  { id: "applicationCount", header: "Applications", cell: (program) => program.applicationCount },
  {
    id: "updated",
    header: "Last changed",
    sortKey: "updatedAt",
    cell: (program) => formatDateTime(program.updatedAt),
  },
];

interface ProgramsTableProps {
  programs: StaffProgramListItem[];
  sorting: DataTableSorting;
}

export function ProgramsTable({ programs, sorting }: ProgramsTableProps) {
  return (
    <DataTable
      label="Programs"
      columns={columns}
      rows={programs}
      getRowId={(program) => program.id}
      sorting={sorting}
    />
  );
}
