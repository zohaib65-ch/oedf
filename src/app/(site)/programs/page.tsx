import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { ProgramList } from "@/features/programs/program-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Programs",
  description:
    "Educational and vocational programs offered through the foundation and its partner institutions.",
  path: "/programs",
});

export default function ProgramPage({ searchParams }: PageProps<"/programs">) {
  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="Educational and vocational programs"
        description="Programs in education, vocational training and skills such as web development and freelancing."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <ProgramList searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
