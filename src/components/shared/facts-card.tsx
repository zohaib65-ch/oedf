import type { ReactNode } from "react";

interface FactsCardProps {
  title: string;
  facts: readonly { label: string; value: ReactNode }[];
  /** An action under the facts, such as an apply button. */
  children?: ReactNode;
}

/** A side card of labelled facts (city, deadline, type) with an optional action. */
export function FactsCard({ title, facts, children }: FactsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-card">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <dl className="mt-6 space-y-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs font-bold tracking-widest text-gold-text uppercase">
              {fact.label}
            </dt>
            <dd className="mt-1 text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
