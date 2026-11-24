import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { PlainTextContent } from "@/components/shared/plain-text-content";
import { ClosingCta } from "@/components/site/closing-cta";
import { NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, newsJsonLd } from "@/lib/structured-data";
import { getNewsPost } from "@/server/services/news.service";

export async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) {
    notFound();
  }

  const facts = [
    ...(post.publishedAt ? [{ label: "Published", value: formatDate(post.publishedAt) }] : []),
    ...(post.eventDate ? [{ label: "Event date", value: formatDate(post.eventDate) }] : []),
    ...(post.venue ? [{ label: "Venue", value: post.venue }] : []),
    { label: "Posted by", value: post.authorName },
  ];

  return (
    <>
      <JsonLd data={newsJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "News and events", path: "/news" },
          { name: post.title, path: `/news/${post.slug}` },
        ])}
      />
      <PageHero
        eyebrow={NEWS_TYPE_LABELS[post.type]}
        title={post.title}
        description={post.excerpt}
      />
      <DetailSection
        backHref="/news"
        backLabel="All news and events"
        aside={<FactsCard title="Details" facts={facts} />}
      >
        <PlainTextContent text={post.body} />
      </DetailSection>
      <ClosingCta />
    </>
  );
}
