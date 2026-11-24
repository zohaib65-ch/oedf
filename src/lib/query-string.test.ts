import { describe, expect, it } from "vitest";

import { buildHref } from "@/lib/query-string";

describe("buildHref", () => {
  it("returns the bare path when there is nothing to add", () => {
    expect(buildHref("/news", {})).toBe("/news");
    expect(buildHref("/news", { type: undefined, page: 1 })).toBe("/news");
  });

  it("adds the given values and leaves out empty ones and the first page", () => {
    expect(buildHref("/research", { type: "BRIEF", year: 2025, q: "", page: 2 })).toBe(
      "/research?type=BRIEF&year=2025&page=2",
    );
  });

  it("encodes values so a search can never break the URL", () => {
    expect(buildHref("/research", { q: "a&b=c" })).toBe("/research?q=a%26b%3Dc");
  });
});
