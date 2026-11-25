import { describe, expect, it } from "vitest";

import { toCsv } from "@/server/lib/csv";

describe("toCsv", () => {
  it("quotes commas, quotes and line breaks, and starts with a byte-order mark", () => {
    const csv = toCsv(["Name", "Note"], [["Khan, Ali", 'Said "hi"\nthen left']]);
    expect(csv).toBe('﻿Name,Note\r\n"Khan, Ali","Said ""hi""\nthen left"\r\n');
  });

  it("keeps text that looks like a formula from running in a spreadsheet", () => {
    const csv = toCsv(["Name"], [['=HYPERLINK("x")'], ["-5"], ["@cmd"], [null], [42]]);
    expect(csv.split("\r\n").slice(1, 6)).toEqual([
      '"\'=HYPERLINK(""x"")"',
      "'-5",
      "'@cmd",
      "",
      "42",
    ]);
  });
});
