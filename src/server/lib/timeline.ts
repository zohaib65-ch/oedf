import "server-only";

/** One line of a record's history: a status change or an internal note. */
export interface TimelineEntry<TStatus extends string> {
  kind: "STATUS" | "NOTE";
  at: string;
  actorName: string;
  /** For a status change: the move; for a note: empty. */
  from?: TStatus | undefined;
  to?: TStatus | undefined;
  text: string;
}

interface StatusHistoryRow {
  from?: string | null;
  to: string;
  reason: string;
  actorName: string;
  at: Date;
}

interface NoteRow {
  authorName: string;
  body: string;
  createdAt: Date;
}

/**
 * Status changes and notes in one list, newest first. The status history schema accepts only the
 * record's own statuses, so reading them as `TStatus` cannot widen anything.
 */
export function buildTimeline<TStatus extends string>(
  statusHistory: readonly StatusHistoryRow[],
  notes: readonly NoteRow[],
): TimelineEntry<TStatus>[] {
  const entries: TimelineEntry<TStatus>[] = [
    ...statusHistory.map((entry) => ({
      kind: "STATUS" as const,
      at: entry.at.toISOString(),
      actorName: entry.actorName,
      from: (entry.from ?? undefined) as TStatus | undefined,
      to: entry.to as TStatus,
      text: entry.reason,
    })),
    ...notes.map((note) => ({
      kind: "NOTE" as const,
      at: note.createdAt.toISOString(),
      actorName: note.authorName,
      text: note.body,
    })),
  ];
  return entries.sort((a, b) => b.at.localeCompare(a.at));
}
