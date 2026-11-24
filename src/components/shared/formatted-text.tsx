import { cn } from "cn";
import { Fragment } from "react";

import { parseFormattedText } from "@/lib/formatted-text";

interface FormattedTextProps {
  text: string;
  /** `lg` for public pages, `base` inside the portal. */
  size?: "lg" | "base";
}

/**
 * Shows stored long text: a blank line starts a paragraph and lines starting with "- " become a
 * bullet list. The text is plain and React escapes it, so nothing typed can ever run as markup.
 */
export function FormattedText({ text, size = "lg" }: FormattedTextProps) {
  const blocks = parseFormattedText(text);
  return (
    <div
      className={cn(
        "leading-relaxed text-foreground",
        size === "lg" ? "space-y-5 text-lg" : "space-y-3",
      )}
    >
      {blocks.map((block, blockIndex) => {
        // The blocks are derived from one string and never reorder, so their position is a stable key.
        const key = `${block.kind}-${String(blockIndex)}`;
        if (block.kind === "list") {
          return (
            <ul key={key} className="list-disc space-y-1 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${String(itemIndex)}`}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${key}-${String(lineIndex)}`}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
