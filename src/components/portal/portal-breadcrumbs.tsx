"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PORTAL_HOME_PATH, PORTAL_NAV, PORTAL_PROFILE_LINK } from "@/lib/constants/navigation";

/** Portal › current page. The page name comes from the portal navigation config. */
export function PortalBreadcrumbs() {
  const pathname = usePathname();
  const current = [...PORTAL_NAV, PORTAL_PROFILE_LINK].find((item) => item.href === pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={PORTAL_HOME_PATH}>Portal</BreadcrumbLink>
        </BreadcrumbItem>
        {current && current.href !== PORTAL_HOME_PATH ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
