import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { PlainTextContent } from "@/components/shared/plain-text-content";
import { ProseBlock } from "@/components/shared/prose-block";
import { ClosingCta } from "@/components/site/closing-cta";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate, hasPassed } from "@/lib/format";
import { breadcrumbJsonLd, jobPostingJsonLd } from "@/lib/structured-data";
import { getVacancy } from "@/server/services/vacancy.service";

export async function VacancyDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const vacancy = await getVacancy(slug);
  if (!vacancy) {
    notFound();
  }
  const isClosed = hasPassed(vacancy.deadline);

  return (
    <>
      {isClosed ? null : <JsonLd data={jobPostingJsonLd(vacancy)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Careers", path: "/careers" },
          { name: vacancy.title, path: `/careers/${vacancy.slug}` },
        ])}
      />
      <PageHero
        eyebrow={vacancy.departmentName}
        title={vacancy.title}
        description={isClosed ? "This vacancy is closed." : undefined}
      />
      <DetailSection
        backHref="/careers"
        backLabel="All vacancies"
        aside={
          <FactsCard
            title="Vacancy details"
            facts={[
              { label: "Department", value: vacancy.departmentName },
              { label: "City", value: vacancy.city },
              { label: "Type", value: EMPLOYMENT_TYPE_LABELS[vacancy.employmentType] },
              {
                label: isClosed ? "Closed on" : "Apply by",
                value: (
                  <time dateTime={vacancy.deadline.toISOString()}>
                    {formatDate(vacancy.deadline)}
                  </time>
                ),
              },
            ]}
          />
        }
      >
        <ProseBlock title="About the role">
          <PlainTextContent text={vacancy.description} />
        </ProseBlock>
        {vacancy.requirements ? (
          <ProseBlock title="Requirements">
            <PlainTextContent text={vacancy.requirements} />
          </ProseBlock>
        ) : null}
      </DetailSection>
      <ClosingCta />
    </>
  );
}
