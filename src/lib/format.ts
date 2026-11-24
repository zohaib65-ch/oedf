// Dates are stored in UTC, so they are shown in UTC too: a deadline never moves by a day with the server's time zone.
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

/** True when the date is already behind us. Read at request time, never inside a cached function. */
export function hasPassed(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** A date such as "24 November 2026". */
export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

/** A moment such as "24 Nov 2026, 14:05", in Pakistan time. Takes the ISO string the API returns. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

const rupeeFormat = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Whole rupees such as "Rs 12,500". */
export function formatPkr(amount: number): string {
  return `Rs ${rupeeFormat.format(amount)}`;
}

/** A stored day (YYYY-MM-DD) such as "24 November 2026". */
export function formatDay(day: string): string {
  return formatDate(new Date(`${day}T00:00:00Z`));
}

const KILOBYTE = 1024;

/** A file size such as "240 KB" or "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < KILOBYTE * KILOBYTE) {
    return `${Math.max(1, Math.round(bytes / KILOBYTE))} KB`;
  }
  return `${(bytes / (KILOBYTE * KILOBYTE)).toFixed(1)} MB`;
}
