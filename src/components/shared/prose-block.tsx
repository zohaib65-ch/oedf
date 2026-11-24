import type { ReactNode } from "react";

interface ProseBlockProps {
  title: string;
  children: ReactNode;
}

/** A titled block of body text inside a detail page. */
export function ProseBlock({ title, children }: ProseBlockProps) {
  return (
    <section>
      <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
