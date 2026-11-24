"use client";

import { Columns3Icon } from "lucide-react";
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

export interface DataTableColumn<TRow> {
  id: string;
  /** Shown in the header and in the Columns menu. */
  header: string;
  cell: (row: TRow) => ReactNode;
  /** An actions column cannot be hidden and has a visually hidden header. */
  isActions?: boolean;
}

interface DataTableProps<TRow> {
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  /** Accessible name of the table. */
  label: string;
  getRowId: (row: TRow) => string;
}

/**
 * The portal's list table, built from shadcn Table. Paging and filters happen on the server (the
 * page reads them from the URL), so this shows the rows it is given and lets each person hide columns.
 */
export function DataTable<TRow>({ columns, rows, label, getRowId }: DataTableProps<TRow>) {
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
                <TableHead key={column.id} scope="col">
                  {column.isActions ? (
                    <span className="sr-only">{column.header}</span>
                  ) : (
                    column.header
                  )}
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
