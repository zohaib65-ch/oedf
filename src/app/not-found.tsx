import { CtaButton } from "@/components/shared/cta-button";
import { PageHero } from "@/components/shared/page-hero";
import { SiteShell } from "@/components/site/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Error 404"
        title="This page could not be found"
        description="The page may have moved, or the address may be wrong."
      >
        <CtaButton href="/" size="lg">
          Back to home
        </CtaButton>
        <CtaButton href="/contact" variant="light" size="lg">
          Contact us
        </CtaButton>
      </PageHero>
    </SiteShell>
  );
}
