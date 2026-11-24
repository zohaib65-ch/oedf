import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";

interface CtaBandProps {
  eyebrow: string;
  title: string;
  description: string;
  /** The buttons on the right. */
  children: ReactNode;
}

/** The closing call to action: a navy card with a gold line along its top edge. */
export function CtaBand({ eyebrow, title, description, children }: CtaBandProps) {
  return (
    <Container>
      <div className="surface-dark flex flex-col justify-between gap-8 rounded-lg border-t-4 border-gold bg-navy p-12 text-foreground shadow-band lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="inline-block rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-lg text-gray-300">{description}</p>
        </div>
        <div className="flex flex-wrap gap-4">{children}</div>
      </div>
    </Container>
  );
}
