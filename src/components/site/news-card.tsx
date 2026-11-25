import { LinkCard } from "@/components/shared/link-card";
import { NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import type { PublicNewsSummary } from "@/server/services/news.service";

/** A post on a list. The cover shows when there is one; otherwise the card is text only. */
export function NewsCard({ post }: { post: PublicNewsSummary }) {
  const date = post.type === "EVENT" ? (post.eventDate ?? post.publishedAt) : post.publishedAt;

  return (
    <LinkCard
      href={`/news/${post.slug}`}
      eyebrow={NEWS_TYPE_LABELS[post.type]}
      title={post.title}
      image={post.image}
      description={post.excerpt}
      meta={date ? <time dateTime={date.toISOString()}>{formatDate(date)}</time> : null}
    />
  );
}
