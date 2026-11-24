import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/shared/back-link";
import { Container } from "@/components/shared/container";
import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ApplyContent } from "@/features/applications/apply-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Apply for admission",
  description: "Apply online for admission to a program of Omar Education Development Foundation.",
  path: "/admissions/apply",
});

export default function ApplyAdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Apply for admission"
        description="Complete the online application. It takes one sitting if your documents are ready."
      />
      <Section tone="warm">
        <Container className="max-w-4xl space-y-8">
          <BackLink href="/admissions">About admissions</BackLink>
          <Suspense fallback={<DetailSkeleton />}>
            <ApplyContent type="ADMISSION" />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
