import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { PublicationList } from "@/features/research/publication-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Research",
  description:
    "Reports, policy papers, feasibility studies, surveys and briefs on education in Pakistan.",
  path: "/research",
});

export default function PublicationPage({ searchParams }: PageProps<"/research">) {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Research and policy work"
        description="Reports, policy papers, studies and briefs from the Research and Policy Institute."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <PublicationList searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
