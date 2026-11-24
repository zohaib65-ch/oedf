import { describe, expect, it } from "vitest";

import {
  effectiveVacancyStatus,
  VACANCY_TRANSITIONS,
  vacancyActionLabel,
} from "@/lib/constants/vacancy-workflow";

const NOW = Date.parse("2026-11-25T10:00:00Z");

describe("vacancy workflow", () => {
  it("shows a published vacancy past its deadline as closed", () => {
    expect(effectiveVacancyStatus("PUBLISHED", "2026-11-24T18:59:59.999Z", NOW)).toBe("CLOSED");
    expect(effectiveVacancyStatus("PUBLISHED", "2026-11-25T18:59:59.999Z", NOW)).toBe("PUBLISHED");
    expect(effectiveVacancyStatus("DRAFT", "2026-11-24T18:59:59.999Z", NOW)).toBe("DRAFT");
  });

  it("names each move after where the vacancy is now", () => {
    expect(vacancyActionLabel("DRAFT", "PUBLISHED")).toBe("Publish");
    expect(vacancyActionLabel("CLOSED", "PUBLISHED")).toBe("Reopen");
    expect(vacancyActionLabel("PUBLISHED", "CLOSED")).toBe("Close");
    expect(VACANCY_TRANSITIONS.DRAFT).toEqual(["PUBLISHED"]);
  });
});
