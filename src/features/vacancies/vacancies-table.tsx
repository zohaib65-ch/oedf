"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { VacancyStatus } from "@/features/vacancies/vacancy-status";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import type { StaffVacancyListItem } from "@/server/repositories/vacancy-management.repository";

const linkClass = "font-semibold text-navy underline underline-offset-2";

const columns: DataTableColumn<StaffVacancyListItem>[] = [
  {
    id: "title",
    header: "Title",
    sortKey: "title",
    cell: (vacancy) => (
      <Link href={`/portal/vacancies/${vacancy.id}`} className={linkClass}>
        {vacancy.title}
      </Link>
    ),
  },
  { id: "office", header: "Office", cell: (vacancy) => vacancy.departmentName },
  { id: "city", header: "City", cell: (vacancy) => vacancy.city },
  {
    id: "type",
    header: "Type",
    cell: (vacancy) => EMPLOYMENT_TYPE_LABELS[vacancy.employmentType],
  },
  {
    id: "deadline",
    header: "Deadline",
    sortKey: "deadline",
    cell: (vacancy) => formatDate(new Date(vacancy.deadline)),
  },
  { id: "status", header: "Status", cell: (vacancy) => <VacancyStatus vacancy={vacancy} /> },
  {
    id: "applications",
    header: "Applications",
    cell: (vacancy) =>
      vacancy.applicationCount === 0 ? (
        "None"
      ) : (
        <Link href={`/portal/job-applications?vacancyId=${vacancy.id}`} className={linkClass}>
          {vacancy.applicationCount}
          <span className="sr-only">
            {vacancy.applicationCount === 1 ? " application" : " applications"} for {vacancy.title}
          </span>
        </Link>
      ),
  },
  {
    id: "created",
    header: "Created",
    sortKey: "createdAt",
    cell: (vacancy) => formatDateTime(vacancy.createdAt),
  },
];

interface VacanciesTableProps {
  vacancies: StaffVacancyListItem[];
  sorting: DataTableSorting;
}

export function VacanciesTable({ vacancies, sorting }: VacanciesTableProps) {
  return (
    <DataTable
      label="Vacancies"
      columns={columns}
      rows={vacancies}
      getRowId={(vacancy) => vacancy.id}
      sorting={sorting}
    />
  );
}
