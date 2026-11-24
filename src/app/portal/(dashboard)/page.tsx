import { LayoutDashboardIcon } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PortalOverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Your department's work at a glance." />
      <EmptyState
        icon={LayoutDashboardIcon}
        title="Nothing to show yet"
        description="Your modules and figures will appear here as they are switched on."
      />
    </>
  );
}
