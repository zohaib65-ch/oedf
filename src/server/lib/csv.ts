import "server-only";

type Cell = string | number | null;

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

function toCell(value: Cell): string {
  let text = value === null ? "" : String(value);
  // A cell such as "=HYPERLINK(...)" typed into a form must stay text when the file is opened.
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * A CSV file as text: a byte-order mark so Excel reads it as UTF-8 (Urdu names stay intact), a
 * header row, and CRLF line endings.
 */
export function toCsv(headers: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(toCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** A download response for a CSV file. Never cached: it holds personal data. */
export function csvResponse(fileName: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
