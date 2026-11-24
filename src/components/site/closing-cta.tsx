import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { CtaBand } from "@/components/site/cta-band";

/** The call to action that closes most public pages. */
export function ClosingCta() {
  return (
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
  );
}
