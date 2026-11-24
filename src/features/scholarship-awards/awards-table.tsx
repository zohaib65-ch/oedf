"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { AWARD_PERIOD_LABELS, AWARD_STATUS_LABELS } from "@/lib/constants/labels";
import { formatDay, formatPkr } from "@/lib/format";
import type { AwardListItem } from "@/server/repositories/scholarship-award.repository";

const TONE = { ACTIVE: "positive", ON_HOLD: "progress", ENDED: "closed" } as const;

const columns: DataTableColumn<AwardListItem>[] = [
  {
    id: "student",
    header: "Student",
    sortKey: "studentName",
    cell: (award) => (
      <Link
        href={`/portal/scholarship-awards/${award.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {award.studentName}
      </Link>
    ),
  },
  { id: "reference", header: "Application", cell: (award) => award.referenceNumber },
  {
    id: "amount",
    header: "Amount",
    sortKey: "amountPkr",
    cell: (award) =>
      `${formatPkr(award.amountPkr)} ${AWARD_PERIOD_LABELS[award.period].toLowerCase()}`,
  },
  {
    id: "start",
    header: "Start",
    sortKey: "startDate",
    cell: (award) => formatDay(award.startDate),
  },
  {
    id: "renewal",
    header: "Renewal",
    sortKey: "renewalDate",
    cell: (award) => (award.renewalDate ? formatDay(award.renewalDate) : "Not set"),
  },
  {
    id: "status",
    header: "Status",
    cell: (award) => (
      <StatusBadge label={AWARD_STATUS_LABELS[award.status]} tone={TONE[award.status]} />
    ),
  },
];

export function AwardsTable({
  awards,
  sorting,
}: {
  awards: AwardListItem[];
  sorting: DataTableSorting;
}) {
  return (
    <DataTable
      label="Scholarship awards"
      columns={columns}
      rows={awards}
      getRowId={(award) => award.id}
      sorting={sorting}
    />
  );
}
