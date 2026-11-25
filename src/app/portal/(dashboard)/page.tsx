import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationsChartLazy } from "@/features/dashboard/applications-chart-lazy";
import { requireSession } from "@/server/auth/session";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export default async function PortalOverviewPage() {
  const staff = await requireSession();
  const summary = await getDashboardSummary(staff);
  const scopeText =
    summary.scope === "ALL_OFFICES" ? "All offices at a glance." : "Your office at a glance.";

  return (
    <>
      <PageHeader title="Overview" description={scopeText} />
      {summary.metrics.length === 0 && !summary.applicationsByMonth ? (
        <EmptyState
          icon={LayoutDashboardIcon}
          title="Nothing to show yet"
          description="Figures for your modules appear here when they apply to your role and office."
        />
      ) : null}
      <section aria-label="Figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <Card key={metric.key} className={metric.isAlert ? "border-destructive" : undefined}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className={metric.isAlert ? "text-3xl text-destructive" : "text-3xl"}>
                {metric.value}
                {metric.isAlert ? <span className="sr-only"> (needs attention)</span> : null}
              </CardTitle>
              {metric.href ? (
                <Link
                  href={metric.href}
                  className="text-sm font-semibold text-navy underline underline-offset-2"
                >
                  View<span className="sr-only"> {metric.label.toLowerCase()}</span>
                </Link>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </section>
      {summary.applicationsByMonth ? (
        <Card>
          <CardHeader>
            <CardTitle>Applications per month</CardTitle>
            <CardDescription>Last 12 months, admissions and scholarships.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsChartLazy data={summary.applicationsByMonth} />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
