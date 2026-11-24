import type { ReactNode } from "react";

import { BackLink } from "@/components/shared/back-link";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";

interface DetailSectionProps {
  backHref: string;
  backLabel: string;
  /** The side column, usually a `FactsCard`. */
  aside?: ReactNode;
  children: ReactNode;
}

/** The body of a detail page: a back link, the main text and an optional side column. */
export function DetailSection({ backHref, backLabel, aside, children }: DetailSectionProps) {
  return (
    <Section>
      <Container>
        <BackLink href={backHref}>{backLabel}</BackLink>
        <div className="mt-8 grid gap-12 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">{children}</div>
          {aside ? <aside className="space-y-6">{aside}</aside> : null}
        </div>
      </Container>
    </Section>
  );
}
