"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import {
  AssignmentStatusBadge,
  OverdueBadge,
  PriorityBadge,
} from "@/features/directive-management/directive-badges";
import { formatDateTime, formatDay } from "@/lib/format";
import type { DirectiveListView } from "@/server/services/directive.service";

const columns: DataTableColumn<DirectiveListView>[] = [
  {
    id: "reference",
    header: "Reference",
    cell: (directive) => <span className="whitespace-nowrap">{directive.referenceNumber}</span>,
  },
  {
    id: "title",
    header: "Title",
    cell: (directive) => (
      <Link
        href={`/portal/directives/${directive.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {directive.title}
      </Link>
    ),
  },
  {
    id: "priority",
    header: "Priority",
    cell: (directive) => <PriorityBadge priority={directive.priority} />,
  },
  {
    id: "due",
    header: "Due",
    sortKey: "dueDate",
    cell: (directive) => (
      <span className="flex flex-wrap items-center gap-2 whitespace-nowrap">
        {formatDay(directive.dueDate)}
        {directive.isOverdue ? <OverdueBadge /> : null}
      </span>
    ),
  },
  {
    id: "offices",
    header: "Offices",
    cell: (directive) => (
      <ul className="space-y-1">
        {directive.assignments.map((assignment) => (
          <li key={assignment.id} className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{assignment.departmentName}</span>
            <AssignmentStatusBadge status={assignment.status} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "issued",
    header: "Issued",
    sortKey: "issuedAt",
    cell: (directive) => formatDateTime(directive.issuedAt),
  },
];

interface DirectivesTableProps {
  directives: DirectiveListView[];
  sorting: DataTableSorting;
}

export function DirectivesTable({ directives, sorting }: DirectivesTableProps) {
  return (
    <DataTable
      label="Directives"
      columns={columns}
      rows={directives}
      getRowId={(directive) => directive.id}
      sorting={sorting}
      isRowHighlighted={(directive) => directive.isOverdue}
    />
  );
}
