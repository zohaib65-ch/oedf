import { Container } from "@/components/shared/container";
import { DraftNotice } from "@/components/shared/draft-notice";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { LEGAL_DRAFT_NOTICE } from "@/content/legal";

interface LegalPageProps {
  document: {
    title: string;
    description: string;
    sections: readonly { heading: string; body: string }[];
  };
}

/** A legal page: a banner and a narrow column of text, marked as a draft for the client to review. */
export function LegalPage({ document }: LegalPageProps) {
  return (
    <>
      <PageHero eyebrow="Legal" title={document.title} description={document.description} />
      <Section>
        <Container className="max-w-3xl space-y-10">
          <DraftNotice>{LEGAL_DRAFT_NOTICE}</DraftNotice>
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                {section.heading}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-foreground">{section.body}</p>
            </section>
          ))}
        </Container>
      </Section>
    </>
  );
}
