import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProgramCard } from "@/components/site/program-card";
import { getPrograms } from "@/server/services/program.service";

const FEATURED_COUNT = 3;

/** The first few published programs. Hidden until a program is published. */
export async function ProgramsSection() {
  await connection();
  const programs = await getPrograms({}, FEATURED_COUNT);
  if (programs.length === 0) {
    return null;
  }

  return (
    <Section tone="warm">
      <Container>
        <SectionHeading
          eyebrow="Programs"
          title="Programs that build skills"
          description="Educational and vocational programs for learners at every stage."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/programs">All programs</CtaButton>
        </div>
      </Container>
    </Section>
  );
}
