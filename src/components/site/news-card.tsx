import { LinkCard } from "@/components/shared/link-card";
import { NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import type { NewsSummary } from "@/server/repositories/news.repository";

export function NewsCard({ post }: { post: NewsSummary }) {
  const date = post.type === "EVENT" ? (post.eventDate ?? post.publishedAt) : post.publishedAt;

  return (
    <LinkCard
      href={`/news/${post.slug}`}
      eyebrow={NEWS_TYPE_LABELS[post.type]}
      title={post.title}
      description={post.excerpt}
      meta={date ? <time dateTime={date.toISOString()}>{formatDate(date)}</time> : null}
    />
  );
}
