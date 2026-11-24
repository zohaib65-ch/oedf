import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHero } from "@/components/shared/page-hero";
import { ClosingCta } from "@/components/site/closing-cta";
import { ADMISSION_DOCUMENTS, ADMISSION_SECTIONS, ADMISSION_STEPS } from "@/content/admissions";
import { ApplicationGuide } from "@/features/admissions/application-guide";
import { ApplicationStatusBanner } from "@/features/admissions/application-status-banner";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admissions",
  description: "How to apply for admission: eligibility, required documents, dates and steps.",
  path: "/admissions",
});

export default function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Admissions"
        description="Eligibility, required documents, dates and steps for applying."
      />
      <Suspense fallback={null}>
        <ApplicationStatusBanner kind="admissions" />
      </Suspense>
      <ApplicationGuide
        sections={ADMISSION_SECTIONS}
        documents={ADMISSION_DOCUMENTS}
        steps={ADMISSION_STEPS}
        applyHref="/admissions/apply"
        applyLabel="Start your admission application"
      />
      <ClosingCta />
    </>
  );
}
