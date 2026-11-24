import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { FormattedText } from "@/components/shared/formatted-text";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ProseBlock } from "@/components/shared/prose-block";
import { ClosingCta } from "@/components/site/closing-cta";
import { publicEnv } from "@/env";
import { JobApplicationForm } from "@/features/careers/job-application-form";
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
          <FormattedText text={vacancy.description} />
        </ProseBlock>
        {vacancy.requirements ? (
          <ProseBlock title="Requirements">
            <FormattedText text={vacancy.requirements} />
          </ProseBlock>
        ) : null}
        {isClosed ? null : (
          <div id="apply" className="scroll-mt-28">
            <ProseBlock title="Apply for this vacancy">
              <div className="rounded-xl border border-border bg-white p-8 shadow-card">
                <JobApplicationForm
                  vacancySlug={vacancy.slug}
                  turnstileSiteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                />
              </div>
            </ProseBlock>
          </div>
        )}
      </DetailSection>
      <ClosingCta />
    </>
  );
}
