import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Logo } from "@/components/shared/logo";
import { HeaderFrame } from "@/components/site/header-frame";
import { MainNav } from "@/components/site/main-nav";
import { MobileNav } from "@/components/site/mobile-nav";
import { TopBar } from "@/components/site/top-bar";
import { APPLY_NOW_LINK } from "@/lib/constants/navigation";
import { SITE_NAME } from "@/lib/constants/site";

/** The sticky site header: top bar, logo, navigation and the "Apply now" button. */
export function Header() {
  return (
    <HeaderFrame>
      <Suspense fallback={null}>
        <TopBar />
      </Suspense>
      <Container className="flex min-h-20.5 items-center justify-between gap-6 py-3">
        <Link href="/" aria-label={`${SITE_NAME}, home`} className="shrink-0">
          <Logo isOnDark />
        </Link>
        <div className="hidden xl:block">
          <MainNav />
        </div>
        <div className="flex items-center gap-3">
          <CtaButton href={APPLY_NOW_LINK.href} className="hidden sm:inline-flex">
            {APPLY_NOW_LINK.label}
          </CtaButton>
          <div className="xl:hidden">
            <MobileNav />
          </div>
        </div>
      </Container>
    </HeaderFrame>
  );
}
