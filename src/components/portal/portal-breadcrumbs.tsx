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

/**
 * Portal › module › details. The module comes from the portal navigation; a page below a module
 * (an application, an award) links back to its list.
 */
export function PortalBreadcrumbs() {
  const pathname = usePathname();
  const current = [...PORTAL_NAV, PORTAL_PROFILE_LINK]
    .filter((item) => item.href !== PORTAL_HOME_PATH)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isDetail = current !== undefined && pathname !== current.href;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={PORTAL_HOME_PATH}>Portal</BreadcrumbLink>
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isDetail ? (
                <BreadcrumbLink href={current.href}>{current.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{current.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {isDetail ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
