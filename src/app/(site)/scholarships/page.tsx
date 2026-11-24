import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHero } from "@/components/shared/page-hero";
import { ClosingCta } from "@/components/site/closing-cta";
import {
  ADMISSION_DOCUMENTS,
  SCHOLARSHIP_EXTRA_DOCUMENTS,
  SCHOLARSHIP_SECTIONS,
  SCHOLARSHIP_STEPS,
} from "@/content/admissions";
import { ApplicationGuide } from "@/features/admissions/application-guide";
import { ApplicationStatusBanner } from "@/features/admissions/application-status-banner";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Scholarships",
  description:
    "Scholarships for learners in financial need: types, eligibility, criteria and renewal rules.",
  path: "/scholarships",
});

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title="Scholarships"
        description="Scholarship types, eligibility, financial-need criteria and renewal rules."
      />
      <Suspense fallback={null}>
        <ApplicationStatusBanner kind="scholarships" />
      </Suspense>
      <ApplicationGuide
        sections={SCHOLARSHIP_SECTIONS}
        documents={[...ADMISSION_DOCUMENTS, ...SCHOLARSHIP_EXTRA_DOCUMENTS]}
        steps={SCHOLARSHIP_STEPS}
        applyHref="/scholarships/apply"
        applyLabel="Start your scholarship application"
      />
      <ClosingCta />
    </>
  );
}
