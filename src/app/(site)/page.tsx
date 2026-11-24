import type { Metadata } from "next";
import { Suspense } from "react";

import { ClosingCta } from "@/components/site/closing-cta";
import { AboutTeaser } from "@/features/home/about-teaser";
import { DepartmentsSection } from "@/features/home/departments-section";
import { FaqSection } from "@/features/home/faq-section";
import { GuidanceSection } from "@/features/home/guidance-section";
import { HeroSection } from "@/features/home/hero-section";
import { ImpactSection } from "@/features/home/impact-section";
import { InstitutionsSection } from "@/features/home/institutions-section";
import { LatestNewsSection } from "@/features/home/latest-news-section";
import { LatestResearchSection } from "@/features/home/latest-research-section";
import { LeadershipSection } from "@/features/home/leadership-section";
import { OrganizationSchema } from "@/features/home/organization-schema";
import { ProgramsSection } from "@/features/home/programs-section";
import { StepsSection } from "@/features/home/steps-section";
import { ValuesSection } from "@/features/home/values-section";
import { WhyOedfSection } from "@/features/home/why-oedf-section";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: SITE_NAME, description: SITE_DESCRIPTION, url: "/", type: "website" },
};

// Sections that read content are separate Suspense boundaries, so the rest of the page is served at once.
export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <OrganizationSchema />
      </Suspense>
      <HeroSection />
      <ValuesSection />
      <WhyOedfSection />
      <Suspense fallback={null}>
        <ImpactSection />
      </Suspense>
      <Suspense fallback={null}>
        <DepartmentsSection />
      </Suspense>
      <Suspense fallback={null}>
        <ProgramsSection />
      </Suspense>
      <GuidanceSection />
      <AboutTeaser />
      <StepsSection />
      <Suspense fallback={null}>
        <LeadershipSection />
      </Suspense>
      <Suspense fallback={null}>
        <LatestResearchSection />
      </Suspense>
      <Suspense fallback={null}>
        <LatestNewsSection />
      </Suspense>
      <Suspense fallback={null}>
        <InstitutionsSection />
      </Suspense>
      <Suspense fallback={null}>
        <FaqSection />
      </Suspense>
      <ClosingCta />
    </>
  );
}
