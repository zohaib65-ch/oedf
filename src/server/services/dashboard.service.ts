import "server-only";

import { hasPermission } from "@/lib/constants/permissions";
import type { StaffContext } from "@/server/auth/api-session";
import {
  countApplicationsByMonth,
  countAwaitingAcknowledgement,
  countCandidatesToScreen,
  countNewApplications,
  countOpenVacancies,
  countOverdueDirectives,
  countPendingVerification,
  countRenewalsDue,
  countUnreadMessages,
  type MonthlyApplications,
} from "@/server/repositories/dashboard.repository";

const CHART_MONTHS = 12;
const OFFICE_WIDE_ROLES = new Set(["SUPER_ADMIN", "CEO_OFFICE"]);

interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  /** Set when the figure needs attention, for example overdue directives. */
  isAlert?: boolean;
  /** The list behind the figure, when there is one. */
  href?: string;
}

export interface DashboardSummary {
  scope: "ALL_OFFICES" | "OWN_OFFICE";
  metrics: DashboardMetric[];
  applicationsByMonth: MonthlyApplications[] | null;
}

/** Counts and chart data for what this person's role and office may see. */
export async function getDashboardSummary(staff: StaffContext): Promise<DashboardSummary> {
  const isOfficeWide = OFFICE_WIDE_ROLES.has(staff.role);
  const officeId = isOfficeWide ? null : staff.departmentId;
  // A member of an office without an office would otherwise see every office's figures.
  const hasScope = isOfficeWide || officeId !== null;
  const can = (permission: Parameters<typeof hasPermission>[1]) => hasPermission(staff, permission);

  const lookups: Promise<DashboardMetric>[] = [];
  const add = (
    key: string,
    label: string,
    count: Promise<number>,
    options: { isAlertWhenPositive?: boolean; href?: string } = {},
  ) =>
    lookups.push(
      count.then((value) => ({
        key,
        label,
        value,
        ...(options.isAlertWhenPositive && value > 0 ? { isAlert: true } : {}),
        ...(options.href ? { href: options.href } : {}),
      })),
    );

  if (can("applications:read")) {
    add("newApplications", "New applications this week", countNewApplications());
    add("pendingVerification", "Applications pending verification", countPendingVerification());
    add("renewalsDue", "Scholarship renewals due in 30 days", countRenewalsDue());
  }
  if (can("vacancies:read")) {
    add("openVacancies", "Open vacancies", countOpenVacancies());
  }
  if (can("job-applications:read")) {
    add("candidatesToScreen", "Candidates to screen", countCandidatesToScreen());
  }
  if (hasScope && can("directives:read")) {
    add(
      "awaitingAcknowledgement",
      "Directives awaiting acknowledgement",
      countAwaitingAcknowledgement(officeId),
      { href: "/portal/directives?status=PENDING_ACKNOWLEDGEMENT" },
    );
    add("overdueDirectives", "Overdue directives", countOverdueDirectives(officeId), {
      isAlertWhenPositive: true,
      href: "/portal/directives?show=OVERDUE",
    });
  }
  if (hasScope && can("messages:read")) {
    add("unreadMessages", "Unread messages", countUnreadMessages(officeId));
  }

  const [metrics, applicationsByMonth] = await Promise.all([
    Promise.all(lookups),
    can("applications:read") ? countApplicationsByMonth(CHART_MONTHS) : Promise.resolve(null),
  ]);
  return { scope: isOfficeWide ? "ALL_OFFICES" : "OWN_OFFICE", metrics, applicationsByMonth };
}
