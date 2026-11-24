import { describe, expect, it } from "vitest";

import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("keeps letters and digits and joins words with single hyphens", () => {
    expect(toSlug("  Senior Teacher (Math) – Vehari, 2027!  ", "vacancy")).toBe(
      "senior-teacher-math-vehari-2027",
    );
    expect(toSlug("Café Coördinator", "vacancy")).toBe("cafe-coordinator");
  });

  it("gives the fallback for a title with no Latin letters or digits", () => {
    expect(toSlug("استاد", "vacancy")).toBe("vacancy");
  });

  it("never ends in a hyphen after shortening", () => {
    const slug = toSlug(`${"a".repeat(79)} b`, "vacancy");
    expect(slug).toBe("a".repeat(79));
  });
});
