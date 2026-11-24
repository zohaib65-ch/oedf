"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";

import { CtaButton } from "@/components/shared/cta-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APPLY_NOW_LINK, SITE_NAV } from "@/lib/constants/navigation";

const ROW_CLASSES = "block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-accent";

/** The mobile menu: a Sheet with the same links as the desktop navigation. */
export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11 rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          aria-label="Open menu"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-4/5 gap-0 overflow-y-auto bg-white text-ink">
        <SheetHeader className="border-b">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
          <Accordion type="multiple">
            {SITE_NAV.map((item) =>
              item.children ? (
                <AccordionItem key={item.href} value={item.href} className="border-b-0">
                  <AccordionTrigger className="px-3 py-3 text-base font-medium hover:no-underline">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pl-3">
                    {item.children.map((child) => (
                      <SheetClose asChild key={child.href}>
                        <Link href={child.href} className={ROW_CLASSES}>
                          {child.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href} className={ROW_CLASSES}>
                    {item.label}
                  </Link>
                </SheetClose>
              ),
            )}
          </Accordion>
          <SheetClose asChild>
            <CtaButton href={APPLY_NOW_LINK.href} className="mt-4 w-full">
              {APPLY_NOW_LINK.label}
            </CtaButton>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
