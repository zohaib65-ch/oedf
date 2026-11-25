import { LinkCard } from "@/components/shared/link-card";
import { PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDate } from "@/lib/format";
import type { PublicPublicationSummary } from "@/server/services/publication.service";

/** A publication on a list. The cover shows when there is one; otherwise the card is text only. */
export function PublicationCard({ publication }: { publication: PublicPublicationSummary }) {
  return (
    <LinkCard
      href={`/research/${publication.slug}`}
      eyebrow={PUBLICATION_TYPE_LABELS[publication.type]}
      title={publication.title}
      image={publication.image}
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
