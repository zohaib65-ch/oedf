import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/portal/app-sidebar";
import { Topbar } from "@/components/portal/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRoleLabel } from "@/lib/constants/labels";
import { requireSession } from "@/server/auth/session";

// The shadcn sidebar remembers whether it was collapsed in this cookie.
const SIDEBAR_COOKIE_NAME = "sidebar_state";

/** The portal frame. Signed-out visitors are sent to the sign-in page before anything is shown. */
export async function PortalShell({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const cookieStore = await cookies();
  const isSidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={isSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <Topbar
            user={{ name: user.name, email: user.email, roleLabel: getRoleLabel(user.role) }}
          />
          <div className="flex-1 space-y-6 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

/** Shown while the session is being checked. */
export function PortalLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
