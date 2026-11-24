import { ShieldAlertIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PORTAL_HOME_PATH } from "@/lib/constants/navigation";

/** Shown instead of a module the signed-in person's role or office does not allow. */
export function ForbiddenView() {
  return (
    <>
      <PageHeader title="Access denied" />
      <EmptyState
        icon={ShieldAlertIcon}
        title="You do not have access to this page"
        description="Your role or office does not include this module. If you need it, ask the Super Admin."
      >
        <Link
          href={PORTAL_HOME_PATH}
          className="font-semibold text-navy underline underline-offset-2"
        >
          Back to the overview
        </Link>
      </EmptyState>
    </>
  );
}
