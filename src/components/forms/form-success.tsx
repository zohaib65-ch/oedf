import { CheckCircle2Icon } from "lucide-react";
import type { ReactNode } from "react";

interface FormSuccessProps {
  title: string;
  children: ReactNode;
}

/** What replaces a form once it was sent. Announced to screen readers. */
export function FormSuccess({ title, children }: FormSuccessProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-border bg-white p-8 text-center shadow-card"
    >
      <CheckCircle2Icon className="mx-auto size-12 text-gold-text" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-lg text-muted-foreground">{children}</div>
    </div>
  );
}
