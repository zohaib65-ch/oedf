import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { InstitutionList } from "@/features/institutions/institution-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Institutions",
  description: "Schools, colleges, training and skills centers that work with the foundation.",
  path: "/institutions",
});

export default function InstitutionPage({ searchParams }: PageProps<"/institutions">) {
  return (
    <>
      <PageHero
        eyebrow="Institutions"
        title="Schools, colleges and training centers"
        description="The institutions that work with the foundation, by city and type."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <InstitutionList searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
