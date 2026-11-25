import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { CtaButton } from "@/components/shared/cta-button";
import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { FormattedText } from "@/components/shared/formatted-text";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ProseBlock } from "@/components/shared/prose-block";
import { PublicImage } from "@/components/shared/public-image";
import { ClosingCta } from "@/components/site/closing-cta";
import { PROGRAM_CATEGORY_LABELS } from "@/lib/constants/labels";
import { breadcrumbJsonLd, programJsonLd } from "@/lib/structured-data";
import { getProgram } from "@/server/services/program.service";

export async function ProgramDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) {
    notFound();
  }

  const facts = [
    { label: "Category", value: PROGRAM_CATEGORY_LABELS[program.category] },
    ...(program.duration ? [{ label: "Duration", value: program.duration }] : []),
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Programs", path: "/programs" },
          { name: program.title, path: `/programs/${program.slug}` },
        ])}
      />
      <JsonLd data={programJsonLd(program)} />
      <PageHero
        eyebrow={PROGRAM_CATEGORY_LABELS[program.category]}
        title={program.title}
        description={program.summary}
      />
      <DetailSection
        backHref="/programs"
        backLabel="All programs"
        aside={
          <FactsCard title="Program details" facts={facts}>
            {program.acceptsApplications ? (
              <CtaButton href="/admissions/apply" className="w-full">
                Apply for admission
              </CtaButton>
            ) : (
              <p className="text-sm text-muted-foreground">
                This program is not accepting applications right now.
              </p>
            )}
          </FactsCard>
        }
      >
        {program.image ? <PublicImage image={program.image} /> : null}
        {program.description ? (
          <ProseBlock title="About this program">
            <FormattedText text={program.description} />
          </ProseBlock>
        ) : null}
        {program.eligibility ? (
          <ProseBlock title="Eligibility">
            <FormattedText text={program.eligibility} />
          </ProseBlock>
        ) : null}
        {program.institutions.length > 0 ? (
          <ProseBlock title="Offered at">
            <ul className="space-y-2 text-lg">
              {program.institutions.map((institution) => (
                <li key={institution.slug}>
                  <Link
                    href={`/institutions/${institution.slug}`}
                    className="font-semibold text-navy hover:underline"
                  >
                    {institution.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">({institution.city})</span>
                </li>
              ))}
            </ul>
          </ProseBlock>
        ) : null}
      </DetailSection>
      <ClosingCta />
    </>
  );
}
