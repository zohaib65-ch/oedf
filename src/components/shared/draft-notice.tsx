import { InfoIcon } from "lucide-react";

/** Marks placeholder text the client has not reviewed yet. Remove it once the text is approved. */
export function DraftNotice({ children }: { children: string }) {
  return (
    <p
      role="note"
      className="flex items-start gap-3 rounded-lg border border-gold/40 bg-warm px-4 py-3 text-sm text-foreground"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden="true" />
      {children}
    </p>
  );
}
