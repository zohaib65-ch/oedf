import { describe, expect, it } from "vitest";

import { parseFormattedText } from "@/lib/formatted-text";

describe("parseFormattedText", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    expect(parseFormattedText("First line\nsecond line\n\n  \nNext paragraph")).toEqual([
      { kind: "paragraph", lines: ["First line", "second line"] },
      { kind: "paragraph", lines: ["Next paragraph"] },
    ]);
  });

  it('turns lines starting with "- " into a bullet list, even inside a paragraph', () => {
    expect(
      parseFormattedText("You need:\r\n- MSc Mathematics\n- Two years teaching\nThanks"),
    ).toEqual([
      { kind: "paragraph", lines: ["You need:"] },
      { kind: "list", items: ["MSc Mathematics", "Two years teaching"] },
      { kind: "paragraph", lines: ["Thanks"] },
    ]);
  });

  it("treats markup as text and a dash without a space as a normal line", () => {
    expect(parseFormattedText("<b>bold</b>\n-not a bullet")).toEqual([
      { kind: "paragraph", lines: ["<b>bold</b>", "-not a bullet"] },
    ]);
    expect(parseFormattedText("   ")).toEqual([]);
  });
});
