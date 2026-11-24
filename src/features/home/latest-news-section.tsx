import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { NewsCard } from "@/components/site/news-card";
import { getLatestNews } from "@/server/services/news.service";

const LATEST_COUNT = 3;

/** The newest news and events. Hidden until something is published. */
export async function LatestNewsSection() {
  await connection();
  const posts = await getLatestNews(LATEST_COUNT);
  if (posts.length === 0) {
    return null;
  }

  return (
    <Section tone="warm">
      <Container>
        <SectionHeading eyebrow="News and events" title="What is happening at the foundation" />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {posts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/news">All news and events</CtaButton>
        </div>
      </Container>
    </Section>
  );
}
