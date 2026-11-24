import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqAccordion } from "@/features/faqs/faq-accordion";
import { getFaqGroups } from "@/server/services/faq.service";

const PREVIEW_COUNT = 5;

/** The first few questions, with a link to all of them. Hidden until a question is published. */
export async function FaqSection() {
  await connection();
  const faqs = (await getFaqGroups()).flatMap((group) => group.faqs).slice(0, PREVIEW_COUNT);
  if (faqs.length === 0) {
    return null;
  }

  return (
    <Section tone="warm">
      <Container className="grid gap-12 lg:grid-cols-3">
        <div>
          <SectionHeading
            align="left"
            eyebrow="FAQs"
            title="Questions applicants ask"
            description="Quick answers about admissions, scholarships and careers."
          />
          <div className="mt-8">
            <CtaButton href="/faqs">All questions</CtaButton>
          </div>
        </div>
        <FaqAccordion faqs={faqs} className="lg:col-span-2" />
      </Container>
    </Section>
  );
}
