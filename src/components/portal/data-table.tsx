"use client";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, Columns3Icon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildHref } from "@/lib/query-string";

export interface DataTableColumn<TRow> {
  id: string;
  /** Shown in the header and in the Columns menu. */
  header: string;
  cell: (row: TRow) => ReactNode;
  /** The `sort` value this column sorts by. Leave out for a column that cannot be sorted. */
  sortKey?: string;
  /** An actions column cannot be hidden and has a visually hidden header. */
  isActions?: boolean;
}

/** Where the list lives and its current URL parameters, so a sortable header can link to the new order. */
export interface DataTableSorting {
  basePath: string;
  /** The current `sort` value, for example `-createdAt`. */
  sort: string;
  /** The other current parameters (filters), kept when the order changes. */
  params: Record<string, string | undefined>;
}

interface DataTableProps<TRow> {
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  /** Accessible name of the table. */
  label: string;
  getRowId: (row: TRow) => string;
  sorting?: DataTableSorting;
}

function SortableHeader({
  header,
  sortKey,
  sorting,
}: {
  header: string;
  sortKey: string;
  sorting: DataTableSorting;
}) {
  const isAscending = sorting.sort === sortKey;
  const isDescending = sorting.sort === `-${sortKey}`;
  // A click sorts ascending first, then flips. The page goes back to 1, because the order changed.
  const next = isAscending ? `-${sortKey}` : sortKey;
  let Icon = ArrowUpDownIcon;
  if (isAscending) {
    Icon = ArrowUpIcon;
  } else if (isDescending) {
    Icon = ArrowDownIcon;
  }
  return (
    <Link
      href={buildHref(sorting.basePath, { ...sorting.params, sort: next, page: undefined })}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {header}
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">, sort {next.startsWith("-") ? "descending" : "ascending"}</span>
    </Link>
  );
}

function HeaderContent<TRow>({
  column,
  sorting,
}: {
  column: DataTableColumn<TRow>;
  sorting: DataTableSorting | undefined;
}) {
  if (column.isActions) {
    return <span className="sr-only">{column.header}</span>;
  }
  if (column.sortKey && sorting) {
    return <SortableHeader header={column.header} sortKey={column.sortKey} sorting={sorting} />;
  }
  return column.header;
}

/**
 * The portal's list table, built from shadcn Table. Paging, filters and sorting happen on the
 * server (the page reads them from the URL); a sortable header is a link to the new order.
 */
export function DataTable<TRow>({ columns, rows, label, getRowId, sorting }: DataTableProps<TRow>) {
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const visibleColumns = columns.filter((column) => !hiddenIds.has(column.id));

  const toggle = (id: string, isVisible: boolean) => {
    const next = new Set(hiddenIds);
    if (isVisible) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setHiddenIds(next);
  };

  const ariaSort = (sortKey: string | undefined) => {
    if (!sortKey || !sorting) {
      return undefined;
    }
    if (sorting.sort === sortKey) {
      return "ascending";
    }
    return sorting.sort === `-${sortKey}` ? "descending" : "none";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3Icon aria-hidden="true" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {columns
              .filter((column) => !column.isActions)
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={!hiddenIds.has(column.id)}
                  onCheckedChange={(isVisible) => {
                    toggle(column.id, isVisible);
                  }}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-lg border bg-card">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.id} scope="col" aria-sort={ariaSort(column.sortKey)}>
                  <HeaderContent column={column} sorting={sorting} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
