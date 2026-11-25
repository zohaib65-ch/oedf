"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { InstitutionStatus } from "@/features/institution-management/institution-status";
import { INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import type { StaffInstitutionListItem } from "@/server/repositories/institution-management.repository";

const columns: DataTableColumn<StaffInstitutionListItem>[] = [
  {
    id: "name",
    header: "Name",
    sortKey: "name",
    cell: (institution) => (
      <Link
        href={`/portal/institutions/${institution.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {institution.name}
      </Link>
    ),
  },
  { id: "type", header: "Type", cell: (institution) => INSTITUTION_TYPE_LABELS[institution.type] },
  { id: "city", header: "City", sortKey: "city", cell: (institution) => institution.city },
  {
    id: "status",
    header: "Status",
    cell: (institution) => (
      <InstitutionStatus status={institution.status} isPublic={institution.isPublic} />
    ),
  },
  { id: "agreements", header: "Agreements", cell: (institution) => institution.agreementCount },
  {
    id: "renewal",
    header: "Next renewal",
    cell: (institution) =>
      institution.nextRenewal
        ? formatDate(new Date(`${institution.nextRenewal}T00:00:00Z`))
        : "None",
  },
  {
    id: "rating",
    header: "Average rating",
    cell: (institution) =>
      institution.averageRating === null
        ? "No reviews"
        : `${institution.averageRating.toFixed(1)} of 5`,
  },
  {
    id: "updated",
    header: "Last changed",
    sortKey: "updatedAt",
    cell: (institution) => formatDateTime(institution.updatedAt),
  },
];

interface InstitutionsTableProps {
  institutions: StaffInstitutionListItem[];
  sorting: DataTableSorting;
}

export function InstitutionsTable({ institutions, sorting }: InstitutionsTableProps) {
  return (
    <DataTable
      label="Institutions"
      columns={columns}
      rows={institutions}
      getRowId={(institution) => institution.id}
      sorting={sorting}
    />
  );
}
