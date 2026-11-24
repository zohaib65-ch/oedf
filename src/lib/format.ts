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
