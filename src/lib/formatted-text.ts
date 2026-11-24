/** A block of stored long text: a paragraph (its lines kept) or a bullet list. */
export type TextBlock = { kind: "paragraph"; lines: string[] } | { kind: "list"; items: string[] };

const BULLET = "- ";

/**
 * Reads plain text the way staff type it in a Textarea: a blank line starts a new paragraph, and
 * lines that start with "- " become a bullet list. No HTML is ever stored or read.
 */
export function parseFormattedText(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const chunk of text.replaceAll("\r\n", "\n").split(/\n\s*\n/)) {
    let current: TextBlock | undefined;
    for (const rawLine of chunk.split("\n")) {
      const line = rawLine.trim();
      if (line === "") {
        continue;
      }
      if (line.startsWith(BULLET)) {
        const item = line.slice(BULLET.length).trim();
        if (current?.kind === "list") {
          current.items.push(item);
        } else {
          current = { kind: "list", items: [item] };
          blocks.push(current);
        }
      } else if (current?.kind === "paragraph") {
        current.lines.push(line);
      } else {
        current = { kind: "paragraph", lines: [line] };
        blocks.push(current);
      }
    }
  }
  return blocks;
}

/** The hint shown under every long-text field, so staff know the two rules. */
export const FORMATTED_TEXT_HINT =
  'Leave a blank line between paragraphs. Start a line with "- " for a bullet point.';
