"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/shared/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PORTAL_HOME_PATH, PORTAL_NAV } from "@/lib/constants/navigation";
import { SITE_NAME } from "@/lib/constants/site";

/** The portal's collapsible navigation. It lists only the modules this person may open. */
export function AppSidebar({ allowedHrefs }: { allowedHrefs: readonly string[] }) {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:hidden">
        <Link href={PORTAL_HOME_PATH} aria-label={`${SITE_NAME}, portal home`}>
          <Logo size="sm" isOnDark />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PORTAL_NAV.filter((item) => allowedHrefs.includes(item.href)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === PORTAL_HOME_PATH
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
