"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SITE_NAV, type NavItem } from "@/lib/constants/navigation";

const TRIGGER_CLASSES =
  "h-10 bg-transparent px-3 text-nav font-bold text-white/90 hover:bg-white/10 hover:text-gold focus:bg-white/10 data-open:bg-white/10 data-open:text-gold data-popup-open:bg-white/10";

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(TRIGGER_CLASSES, isActivePath(pathname, item.href) && "text-gold")}
      >
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="mt-3 rounded-2xl border-t-4 border-gold bg-white p-3 text-ink shadow-band md:w-160">
        <ul className="grid grid-cols-2 gap-1">
          {item.children?.map((child) => (
            <li key={child.href}>
              <NavigationMenuLink asChild className="items-start gap-3 p-3">
                <Link href={child.href}>
                  {child.icon ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold-text">
                      <child.icon aria-hidden="true" />
                    </span>
                  ) : null}
                  <span>
                    <span className="block font-bold">{child.label}</span>
                    {child.description ? (
                      <span className="mt-1 line-clamp-2 block text-sm text-gray-600">
                        {child.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

/** The desktop navigation. Items with children open a dropdown panel. */
export function MainNav() {
  const pathname = usePathname();
  return (
    <NavigationMenu viewport={false} aria-label="Main">
      <NavigationMenuList className="gap-0.5">
        {SITE_NAV.map((item) =>
          item.children ? (
            <NavDropdown key={item.href} item={item} pathname={pathname} />
          ) : (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                asChild
                className={cn(
                  TRIGGER_CLASSES,
                  "inline-flex items-center rounded-lg",
                  isActivePath(pathname, item.href) && "text-gold",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
