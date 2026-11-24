import { PortalBreadcrumbs } from "@/components/portal/portal-breadcrumbs";
import { UserMenu } from "@/components/portal/user-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopbarProps {
  user: { name: string; email: string; roleLabel: string };
}

/** The portal's top bar: sidebar toggle, breadcrumbs and the user menu. */
export function Topbar({ user }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-4" />
      <PortalBreadcrumbs />
      <div className="ml-auto">
        <UserMenu {...user} />
      </div>
    </header>
  );
}
