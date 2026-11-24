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
  title: "Apply for a scholarship",
  description: "Apply online for a scholarship from Omar Education Development Foundation.",
  path: "/scholarships/apply",
});

export default function ApplyScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title="Apply for a scholarship"
        description="Complete the online application, including your financial information and proof of income."
      />
      <Section tone="warm">
        <Container className="max-w-4xl space-y-8">
          <BackLink href="/scholarships">About scholarships</BackLink>
          <Suspense fallback={<DetailSkeleton />}>
            <ApplyContent type="SCHOLARSHIP" />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
