import { CheckCircle2Icon } from "lucide-react";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { APPLICANT_GUIDANCE } from "@/content/home";

/** What an applicant should prepare, on a dark band. */
export function GuidanceSection() {
  return (
    <Section className="surface-dark bg-navy-deep text-foreground">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow={APPLICANT_GUIDANCE.eyebrow}
            title={APPLICANT_GUIDANCE.title}
            description={APPLICANT_GUIDANCE.description}
          />
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaButton href="/admissions/apply" size="lg">
              Start application
            </CtaButton>
            <CtaButton href="/contact" variant="light" size="lg">
              Get help
            </CtaButton>
          </div>
        </div>
        <ul className="space-y-4">
          {APPLICANT_GUIDANCE.checklist.map((item) => (
            <li
              key={item}
              className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-5 text-lg"
            >
              <CheckCircle2Icon className="size-6 shrink-0 text-gold" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
