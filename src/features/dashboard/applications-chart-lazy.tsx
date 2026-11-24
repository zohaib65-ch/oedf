"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/** The chart library is large, so it loads only on the dashboard, after the page is shown. */
export const ApplicationsChartLazy = dynamic(
  () =>
    import("@/features/dashboard/applications-chart").then((module) => module.ApplicationsChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> },
);
