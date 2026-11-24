import { describe, expect, it } from "vitest";

import {
  parseNewsFilters,
  parseProgramFilters,
  parsePublicationFilters,
  parseVacancyFilters,
} from "@/lib/validations/list-params";

describe("list params", () => {
  it("reads valid filters from the URL", () => {
    expect(parseProgramFilters({ category: "SKILLS" })).toEqual({ category: "SKILLS" });
    expect(
      parsePublicationFilters({ type: "BRIEF", year: "2025", q: "  literacy ", page: "3" }),
    ).toEqual({
      type: "BRIEF",
      year: 2025,
      q: "literacy",
      page: 3,
    });
  });

  it("ignores unknown or malformed values instead of failing the page", () => {
    expect(parseProgramFilters({ category: "NOPE" })).toEqual({ category: undefined });
    expect(parseNewsFilters({ type: "x", page: "-4" })).toEqual({ type: undefined, page: 1 });
    expect(parseNewsFilters({ page: "abc" }).page).toBe(1);
    expect(parsePublicationFilters({ year: "1800", page: "99999" })).toMatchObject({
      year: undefined,
      page: 1,
    });
  });

  it("uses only the first value of a repeated parameter and drops empty text", () => {
    expect(parseVacancyFilters({ city: ["Vehari", "Multan"], department: "" })).toEqual({
      city: "Vehari",
      department: undefined,
      type: undefined,
    });
  });

  it("limits the length of the search text", () => {
    expect(parsePublicationFilters({ q: "a".repeat(101) }).q).toBeUndefined();
  });
});
