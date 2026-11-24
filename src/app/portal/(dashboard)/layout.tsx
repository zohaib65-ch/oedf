import type { Metadata } from "next";
import { Suspense } from "react";

import { PortalLoading, PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <PortalShell>{children}</PortalShell>
    </Suspense>
  );
}
