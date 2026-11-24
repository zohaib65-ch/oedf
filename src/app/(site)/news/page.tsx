import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { NewsList } from "@/features/news/news-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "News and events",
  description: "News and events from Omar Education Development Foundation.",
  path: "/news",
});

export default function NewsPage({ searchParams }: PageProps<"/news">) {
  return (
    <>
      <PageHero
        eyebrow="News and events"
        title="News and events"
        description="Announcements, articles and upcoming events."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <NewsList searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
