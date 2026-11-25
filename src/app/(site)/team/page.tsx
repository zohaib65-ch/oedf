import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { TeamGrid } from "@/features/team/team-grid";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our team",
  description: "Meet the people who run Omar Education Development Foundation.",
  path: "/team",
});

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Team"
        title="The people behind the foundation"
        description="Meet the team that runs our admissions, scholarships, programs and research."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <TeamGrid />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
