import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface LinkCardProps {
  href: string;
  title: string;
  description?: string;
  /** A small label above the title, such as a category or type. */
  eyebrow?: string;
  /** Extra detail under the text: date, city, duration. */
  meta?: ReactNode;
  /** The text of the link at the bottom of the card. */
  cta?: string;
}

/** A whole-card link used by every list page: departments, programs, institutions, news, research. */
export function LinkCard({
  href,
  title,
  description,
  eyebrow,
  meta,
  cta = "Read more",
}: LinkCardProps) {
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-white p-8 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      {eyebrow ? (
        <p className="text-xs font-bold tracking-widest text-gold-text uppercase">{eyebrow}</p>
      ) : null}
      <h3 className="mt-2 text-xl leading-snug font-bold text-foreground">
        {/* The link's ::after covers the whole card, so the card is one big target. */}
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {title}
        </Link>
      </h3>
      {description ? (
        <p className="mt-3 line-clamp-4 leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {meta ? <div className="mt-4 text-sm text-muted-foreground">{meta}</div> : null}
      <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-navy">
        {cta}
        <ArrowRightIcon
          className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </article>
  );
}
