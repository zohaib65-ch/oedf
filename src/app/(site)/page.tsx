import { CtaButton } from "@/components/shared/cta-button";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { CtaBand } from "@/components/site/cta-band";
import { SITE_NAME, SITE_SHORT_NAME } from "@/lib/constants/site";

// Holding page. The real home page is built in Phase 3.
export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow={SITE_SHORT_NAME}
        title={SITE_NAME}
        description="Our new website is on its way."
      />
      <Section tone="warm">
        <CtaBand
          eyebrow="Admissions and scholarships"
          title="Ready to apply?"
          description="Start your application online, or contact us with a question."
        >
          <CtaButton href="/admissions/apply" size="lg">
            Apply now
          </CtaButton>
          <CtaButton href="/contact" variant="light" size="lg">
            Contact us
          </CtaButton>
        </CtaBand>
      </Section>
    </>
  );
}
