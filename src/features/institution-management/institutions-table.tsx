"use client";

import { Trash2Icon } from "lucide-react";
import Link from "next/link";

import { BlockedIconButton } from "@/components/portal/blocked-icon-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { DeleteInstitutionButton } from "@/features/institution-management/delete-institution-button";
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

/** Why a row's delete is greyed out, or null when it can be deleted. The server checks the same. */
function deleteBlocker(institution: StaffInstitutionListItem, canPublish: boolean): string | null {
  if (institution.agreementCount > 0 || institution.reviewCount > 0) {
    return "Has agreements or reviews: set it to Closed instead";
  }
  if (institution.isPublic && !canPublish) {
    return "On the public site: a Director deletes it";
  }
  return null;
}

function DeleteCell({
  institution,
  canPublish,
}: {
  institution: StaffInstitutionListItem;
  canPublish: boolean;
}) {
  const blocker = deleteBlocker(institution, canPublish);
  return blocker ? (
    <BlockedIconButton icon={Trash2Icon} label={`Delete ${institution.name}`} reason={blocker} />
  ) : (
    <DeleteInstitutionButton institutionId={institution.id} name={institution.name} isCompact />
  );
}

interface InstitutionsTableProps {
  institutions: StaffInstitutionListItem[];
  sorting: DataTableSorting;
  /** May delete institutions (`institutions:write` and `content:delete`): adds the delete column. */
  canDelete: boolean;
  /** May also delete a public one (`institutions:publish`). */
  canPublish: boolean;
}

export function InstitutionsTable({
  institutions,
  sorting,
  canDelete,
  canPublish,
}: InstitutionsTableProps) {
  const actions: DataTableColumn<StaffInstitutionListItem> = {
    id: "actions",
    header: "Actions",
    isActions: true,
    cell: (institution) => <DeleteCell institution={institution} canPublish={canPublish} />,
  };
  return (
    <DataTable
      label="Institutions"
      columns={canDelete ? [...columns, actions] : columns}
      rows={institutions}
      getRowId={(institution) => institution.id}
      sorting={sorting}
    />
  );
}
