import { LinkCard } from "@/components/shared/link-card";
import { PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import type { PublicationSummary } from "@/server/repositories/publication.repository";

export function PublicationCard({ publication }: { publication: PublicationSummary }) {
  return (
    <LinkCard
      href={`/research/${publication.slug}`}
      eyebrow={PUBLICATION_TYPE_LABELS[publication.type]}
      title={publication.title}
      description={publication.summary}
      meta={
        publication.publishedOn ? (
          <time dateTime={publication.publishedOn.toISOString()}>
            {formatDate(publication.publishedOn)}
          </time>
        ) : null
      }
      cta="Read summary"
    />
  );
}
