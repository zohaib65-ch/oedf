import "server-only";

// Staff pick days and times in Pakistan time; the database stores UTC.
const PAKISTAN_OFFSET = "+05:00";
const PAKISTAN_OFFSET_MS = 5 * 3_600_000;
const DAY_MS = 86_400_000;

const startOfPakistanDay = (day: string) => new Date(`${day}T00:00:00${PAKISTAN_OFFSET}`);

/**
 * Turns a "from" and "to" day (YYYY-MM-DD, both included) into UTC bounds: the start of the first
 * day, and the start of the day after the last one (exclusive).
 */
export function toDayRange(from?: string, to?: string): { from?: Date; to?: Date } {
  return {
    ...(from ? { from: startOfPakistanDay(from) } : {}),
    ...(to ? { to: new Date(startOfPakistanDay(to).getTime() + DAY_MS) } : {}),
  };
}

/** The last moment of a day in Pakistan time, so a deadline includes the whole day. */
export function endOfPakistanDay(day: string): Date {
  return new Date(startOfPakistanDay(day).getTime() + DAY_MS - 1);
}

/** The day (YYYY-MM-DD) a moment falls on in Pakistan time. */
export function toPakistanDay(date: Date): string {
  return new Date(date.getTime() + PAKISTAN_OFFSET_MS).toISOString().slice(0, 10);
}

/** A date and time typed in Pakistan time (YYYY-MM-DDTHH:mm) as a moment. */
export function fromPakistanDateTime(local: string): Date {
  return new Date(`${local}${PAKISTAN_OFFSET}`);
}

/** A moment as a datetime-local value (YYYY-MM-DDTHH:mm) in Pakistan time. */
export function toPakistanDateTime(date: Date): string {
  return new Date(date.getTime() + PAKISTAN_OFFSET_MS).toISOString().slice(0, 16);
}
