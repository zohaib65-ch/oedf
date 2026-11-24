import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { FormattedText } from "@/components/shared/formatted-text";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ProseBlock } from "@/components/shared/prose-block";
import { ClosingCta } from "@/components/site/closing-cta";
import { PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, publicationJsonLd } from "@/lib/structured-data";
import { getPublication } from "@/server/services/publication.service";

export async function PublicationDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) {
    notFound();
  }

  const facts = [
    { label: "Type", value: PUBLICATION_TYPE_LABELS[publication.type] },
    ...(publication.publishedOn
      ? [{ label: "Published", value: formatDate(publication.publishedOn) }]
      : []),
    ...(publication.authors.length > 0
      ? [{ label: "Authors", value: publication.authors.join(", ") }]
      : []),
    ...(publication.tags.length > 0
      ? [{ label: "Topics", value: publication.tags.join(", ") }]
      : []),
  ];

  return (
    <>
      <JsonLd data={publicationJsonLd(publication)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Research", path: "/research" },
          { name: publication.title, path: `/research/${publication.slug}` },
        ])}
      />
      <PageHero eyebrow={PUBLICATION_TYPE_LABELS[publication.type]} title={publication.title} />
      <DetailSection
        backHref="/research"
        backLabel="All research"
        aside={<FactsCard title="Publication details" facts={facts} />}
      >
        <ProseBlock title="Summary">
          <FormattedText text={publication.summary} />
        </ProseBlock>
      </DetailSection>
      <ClosingCta />
    </>
  );
}
