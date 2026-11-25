import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { FormattedText } from "@/components/shared/formatted-text";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ProseBlock } from "@/components/shared/prose-block";
import { PublicImage } from "@/components/shared/public-image";
import { ClosingCta } from "@/components/site/closing-cta";
import { INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getInstitution } from "@/server/services/institution.service";

export async function InstitutionDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const institution = await getInstitution(slug);
  if (!institution) {
    notFound();
  }

  const facts = [
    { label: "Type", value: INSTITUTION_TYPE_LABELS[institution.type] },
    { label: "City", value: institution.city },
    ...(institution.address ? [{ label: "Address", value: institution.address }] : []),
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Institutions", path: "/institutions" },
          { name: institution.name, path: `/institutions/${institution.slug}` },
        ])}
      />
      <PageHero
        eyebrow={INSTITUTION_TYPE_LABELS[institution.type]}
        title={institution.name}
        description={institution.city}
      />
      <DetailSection
        backHref="/institutions"
        backLabel="All institutions"
        aside={<FactsCard title="Institution details" facts={facts} />}
      >
        {institution.image ? <PublicImage image={institution.image} /> : null}
        {institution.description ? (
          <ProseBlock title="About">
            <FormattedText text={institution.description} />
          </ProseBlock>
        ) : null}
        {institution.programs.length > 0 ? (
          <ProseBlock title="Programs offered">
            <ul className="space-y-2 text-lg">
              {institution.programs.map((program) => (
                <li key={program.slug}>
                  <Link
                    href={`/programs/${program.slug}`}
                    className="font-semibold text-navy hover:underline"
                  >
                    {program.title}
                  </Link>
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
