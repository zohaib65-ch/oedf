"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonthlyApplications } from "@/server/repositories/dashboard.repository";

const chartConfig = {
  admissions: { label: "Admissions", color: "var(--chart-1)" },
  scholarships: { label: "Scholarships", color: "var(--chart-2)" },
} satisfies ChartConfig;

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const toLabel = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`));

/** Applications received in each of the last 12 months. A table below repeats the figures for screen readers. */
export function ApplicationsChart({ data }: { data: MonthlyApplications[] }) {
  const rows = data.map((row) => ({ ...row, label: toLabel(row.month) }));
  return (
    <>
      <ChartContainer config={chartConfig} className="h-72 w-full" aria-hidden="true">
        <BarChart data={rows} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="admissions" fill="var(--color-admissions)" radius={4} />
          <Bar dataKey="scholarships" fill="var(--color-scholarships)" radius={4} />
        </BarChart>
      </ChartContainer>
      <div className="sr-only">
        <Table aria-label="Applications received per month, last 12 months" isScrollRegion={false}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Month</TableHead>
              <TableHead scope="col">Admissions</TableHead>
              <TableHead scope="col">Scholarships</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableHead scope="row">{row.label}</TableHead>
                <TableCell>{row.admissions}</TableCell>
                <TableCell>{row.scholarships}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
