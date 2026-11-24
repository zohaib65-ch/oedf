import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Buttons shown under the text. */
  children?: ReactNode;
}

/** The dark banner at the top of a page. Its top padding clears the fixed header. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <div className="surface-dark pt-44 pb-20 text-foreground bg-hero">
      <Container className="flex flex-col items-center text-center">
        <p className="rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl leading-tight font-extrabold tracking-tight text-balance md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-300">{description}</p>
        ) : null}
        {children ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4">{children}</div>
        ) : null}
      </Container>
    </div>
  );
}
