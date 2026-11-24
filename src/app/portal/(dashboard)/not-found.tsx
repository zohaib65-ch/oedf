import { SearchXIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PORTAL_HOME_PATH } from "@/lib/constants/navigation";

/** Shown inside the portal when a record (an application, an award) does not exist. */
export default function PortalNotFound() {
  return (
    <>
      <PageHeader title="Not found" />
      <EmptyState
        icon={SearchXIcon}
        title="This record could not be found"
        description="It may have been removed, or the link may be wrong."
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
