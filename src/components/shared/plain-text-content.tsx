interface PlainTextContentProps {
  text: string;
}

/**
 * Renders stored text as paragraphs (a blank line starts a new one). React escapes the text, so
 * it can never run markup. Rich text arrives with the portal editor in Phase 6.
 */
export function PlainTextContent({ text }: PlainTextContentProps) {
  const paragraphs = text.split(/\n\s*\n/).map((paragraph) => paragraph.trim());
  return (
    <div className="space-y-5 text-lg leading-relaxed text-foreground">
      {paragraphs
        .filter((paragraph) => paragraph !== "")
        .map((paragraph) => (
          <p key={paragraph} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
    </div>
  );
}
