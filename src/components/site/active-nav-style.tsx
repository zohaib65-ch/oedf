"use client";

import { usePathname } from "next/navigation";

import { SITE_NAV, type NavItem } from "@/lib/constants/navigation";

function isCurrent(pathname: string, item: NavItem): boolean {
  return [item.href, ...(item.children?.map((child) => child.href) ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/**
 * Colors the navigation item for the current page. The path is only known at request time, so this
 * loads after the page shell and renders no visible element, just one style rule. The navigation
 * itself stays in the shell and never jumps. The rule uses only link targets from SITE_NAV.
 */
export function ActiveNavStyle() {
  const pathname = usePathname();
  const current = SITE_NAV.find((item) => isCurrent(pathname, item));
  if (!current) {
    return null;
  }
  return <style>{`[data-nav-item="${current.href}"]{color:var(--color-gold)}`}</style>;
}
