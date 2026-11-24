import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PublicationCard } from "@/components/site/publication-card";
import { getLatestPublications } from "@/server/services/publication.service";

const LATEST_COUNT = 3;

/** The newest published research. Hidden until something is published. */
export async function LatestResearchSection() {
  await connection();
  const publications = await getLatestPublications(LATEST_COUNT);
  if (publications.length === 0) {
    return null;
  }

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Research"
          title="Latest research and policy work"
          description="Reports, studies and briefs from the Research and Policy Institute."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {publications.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/research">All research</CtaButton>
        </div>
      </Container>
    </Section>
  );
}
