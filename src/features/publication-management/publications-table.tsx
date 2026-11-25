"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { DeletePublicationButton } from "@/features/publication-management/delete-publication-button";
import { CONTENT_STATUS_LABELS, PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDateTime, formatDay } from "@/lib/format";
import type { StaffPublicationListItem } from "@/server/repositories/publication-management.repository";

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;

const columns: DataTableColumn<StaffPublicationListItem>[] = [
  {
    id: "title",
    header: "Title",
    sortKey: "title",
    cell: (publication) => (
      <Link
        href={`/portal/publications/${publication.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {publication.title}
      </Link>
    ),
  },
  { id: "type", header: "Type", cell: (publication) => PUBLICATION_TYPE_LABELS[publication.type] },
  {
    id: "status",
    header: "Status",
    cell: (publication) => (
      <StatusBadge
        label={CONTENT_STATUS_LABELS[publication.status]}
        tone={TONE[publication.status]}
      />
    ),
  },
  {
    id: "publishedOn",
    header: "Publish date",
    sortKey: "publishedOn",
    cell: (publication) =>
      publication.publishedOn ? formatDay(publication.publishedOn) : "Not set",
  },
  { id: "pdf", header: "PDF", cell: (publication) => (publication.hasPdf ? "Yes" : "No") },
  {
    id: "updated",
    header: "Last changed",
    sortKey: "updatedAt",
    cell: (publication) => formatDateTime(publication.updatedAt),
  },
];

const deleteColumn: DataTableColumn<StaffPublicationListItem> = {
  id: "actions",
  header: "Actions",
  isActions: true,
  cell: (publication) => (
    <DeletePublicationButton publicationId={publication.id} title={publication.title} isCompact />
  ),
};

interface PublicationsTableProps {
  publications: StaffPublicationListItem[];
  sorting: DataTableSorting;
  /** May delete publications (a Director: `publications:publish` and `content:delete`). */
  canDelete: boolean;
}

export function PublicationsTable({ publications, sorting, canDelete }: PublicationsTableProps) {
  return (
    <DataTable
      label="Publications"
      columns={canDelete ? [...columns, deleteColumn] : columns}
      rows={publications}
      getRowId={(publication) => publication.id}
      sorting={sorting}
    />
  );
}
