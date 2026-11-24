import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { VacancyList } from "@/features/careers/vacancy-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Careers",
  description: "Open vacancies at Omar Education Development Foundation.",
  path: "/careers",
});

export default function VacancyPage({ searchParams }: PageProps<"/careers">) {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Work with the foundation"
        description="Open vacancies across the foundation and its institutions."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <VacancyList searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
