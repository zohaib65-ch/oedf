import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { DraftNotice } from "@/components/shared/draft-notice";
import { IconCard } from "@/components/shared/icon-card";
import { ProseBlock } from "@/components/shared/prose-block";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { DOCUMENT_FORMAT_NOTE, TO_BE_CONFIRMED } from "@/content/admissions";

interface ApplicationGuideProps {
  /** Text blocks such as eligibility and dates. Their text is shown as the client supplied it. */
  sections: readonly { title: string; description: string }[];
  documents: readonly { icon: LucideIcon; title: string; description: string }[];
  steps: readonly { title: string; description: string }[];
  applyHref: string;
  applyLabel: string;
}

/** The body shared by the Admissions and Scholarships pages. */
export function ApplicationGuide({
  sections,
  documents,
  steps,
  applyHref,
  applyLabel,
}: ApplicationGuideProps) {
  const hasUnconfirmedText = sections.some((section) => section.description === TO_BE_CONFIRMED);

  return (
    <>
      <Section>
        <Container className="space-y-10">
          {hasUnconfirmedText ? (
            <DraftNotice>
              Draft: the foundation has not supplied these details yet, so they are marked as to be
              confirmed.
            </DraftNotice>
          ) : null}
          <div className="grid gap-8 md:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-xl border border-border bg-white p-8 shadow-card"
              >
                <ProseBlock title={section.title}>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                </ProseBlock>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Section tone="warm">
        <Container>
          <SectionHeading
            eyebrow="Documents"
            title="What you need to upload"
            description={DOCUMENT_FORMAT_NOTE}
          />
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {documents.map((document) => (
              <IconCard key={document.title} {...document} />
            ))}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading eyebrow="Steps" title="How the application works" />
          <ol className="mx-auto mt-14 max-w-3xl space-y-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex items-start gap-5 rounded-xl border border-border bg-white p-6 shadow-card"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-gold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <CtaButton href={applyHref} size="lg">
              {applyLabel}
            </CtaButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
