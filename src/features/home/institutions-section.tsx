import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { InstitutionCard } from "@/components/site/institution-card";
import { getInstitutions } from "@/server/services/institution.service";

const FEATURED_COUNT = 3;

/** A few partner institutions. Hidden until one is active and public. */
export async function InstitutionsSection() {
  await connection();
  const institutions = await getInstitutions({}, FEATURED_COUNT);
  if (institutions.length === 0) {
    return null;
  }

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Institutions"
          title="Schools, colleges and training centers"
          description="The institutions where the foundation's programs are offered."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {institutions.map((institution) => (
            <InstitutionCard key={institution.id} institution={institution} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/institutions">All institutions</CtaButton>
        </div>
      </Container>
    </Section>
  );
}
