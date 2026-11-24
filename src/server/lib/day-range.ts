import "server-only";

// Staff pick whole days in Pakistan time; the database stores UTC.
const PAKISTAN_OFFSET = "+05:00";
const DAY_MS = 86_400_000;

/**
 * Turns a "from" and "to" day (YYYY-MM-DD, both included) into UTC bounds: the start of the first
 * day, and the start of the day after the last one (exclusive).
 */
export function toDayRange(from?: string, to?: string): { from?: Date; to?: Date } {
  return {
    ...(from ? { from: new Date(`${from}T00:00:00${PAKISTAN_OFFSET}`) } : {}),
    ...(to
      ? { to: new Date(new Date(`${to}T00:00:00${PAKISTAN_OFFSET}`).getTime() + DAY_MS) }
      : {}),
  };
}
