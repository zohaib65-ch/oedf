import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { FooterContact } from "@/components/site/footer-contact";
import { FooterSocial } from "@/components/site/footer-social";
import { FOOTER_NAV } from "@/lib/constants/navigation";
import { SECP_REGISTRATION_NUMBER, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

// eslint-disable-next-line @typescript-eslint/require-await -- Next.js requires a cached component to be async.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** The site footer: logo, mission, links, contact details and the registration number. */
export function Footer() {
  return (
    <footer className="surface-dark border-t border-sidebar-border bg-navy pt-20 pb-8 text-gray-400">
      <Container>
        <div className="grid gap-12 lg:grid-cols-7">
          <div className="space-y-6 lg:col-span-2">
            <Logo size="lg" isOnDark />
            <p className="text-sm leading-relaxed">{SITE_DESCRIPTION}</p>
            <Suspense fallback={null}>
              <FooterSocial />
            </Suspense>
          </div>
          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                {group.title}
              </h2>
              <ul className="mt-6 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Our address</h2>
            <div className="mt-6">
              <Suspense fallback={null}>
                <FooterContact />
              </Suspense>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-2 border-t border-sidebar-border pt-8 text-xs sm:flex-row">
          <p>
            &copy;{" "}
            <Suspense fallback={null}>
              <CopyrightYear />
            </Suspense>{" "}
            {SITE_NAME}. All rights reserved.
          </p>
          <p>SECP Registration No. {SECP_REGISTRATION_NUMBER}</p>
        </div>
      </Container>
    </footer>
  );
}
