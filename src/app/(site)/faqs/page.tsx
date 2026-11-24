import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { FaqGroups } from "@/features/faqs/faq-groups";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQs",
  description:
    "Answers to common questions about admissions, scholarships, careers and the foundation.",
  path: "/faqs",
});

export default function FaqsPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="Frequently asked questions"
        description="Answers to the questions we hear most, grouped by topic."
      />
      <Section>
        <Container className="max-w-3xl">
          <Suspense fallback={<DetailSkeleton />}>
            <FaqGroups />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
