"use client";

import { Trash2Icon } from "lucide-react";
import Link from "next/link";

import { BlockedIconButton } from "@/components/portal/blocked-icon-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { DeleteProgramButton } from "@/features/program-management/delete-program-button";
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

/** Why a row's delete is greyed out, or null when it can be deleted. The server checks the same. */
function deleteBlocker(program: StaffProgramListItem, canPublish: boolean): string | null {
  if (program.applicationCount > 0) {
    return "Has applications: archive it instead";
  }
  if (program.status !== "DRAFT" && !canPublish) {
    return "Not a draft: a Director deletes it";
  }
  return null;
}

function DeleteCell({
  program,
  canPublish,
}: {
  program: StaffProgramListItem;
  canPublish: boolean;
}) {
  const blocker = deleteBlocker(program, canPublish);
  return blocker ? (
    <BlockedIconButton icon={Trash2Icon} label={`Delete ${program.title}`} reason={blocker} />
  ) : (
    <DeleteProgramButton programId={program.id} title={program.title} isCompact />
  );
}

interface ProgramsTableProps {
  programs: StaffProgramListItem[];
  sorting: DataTableSorting;
  /** May delete programs (`programs:write`): adds the delete column. */
  canDelete: boolean;
  /** May also delete a published or archived one (`programs:publish`). */
  canPublish: boolean;
}

export function ProgramsTable({ programs, sorting, canDelete, canPublish }: ProgramsTableProps) {
  const actions: DataTableColumn<StaffProgramListItem> = {
    id: "actions",
    header: "Actions",
    isActions: true,
    cell: (program) => <DeleteCell program={program} canPublish={canPublish} />,
  };
  return (
    <DataTable
      label="Programs"
      columns={canDelete ? [...columns, actions] : columns}
      rows={programs}
      getRowId={(program) => program.id}
      sorting={sorting}
    />
  );
}
