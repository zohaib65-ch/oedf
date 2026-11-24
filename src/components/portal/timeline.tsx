import { ArrowRightIcon, MessageSquareIcon } from "lucide-react";

import { formatDateTime } from "@/lib/format";

export interface TimelineItem {
  id: string;
  at: string;
  actorName: string;
  /** For a status change, "Under review → Verified"; left out for a note. */
  change?: string | undefined;
  text: string;
}

/** A record's history, newest first: status changes with their reason, and internal notes. */
export function Timeline({
  items,
  emptyText,
}: {
  items: readonly TimelineItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ol className="space-y-4">
      {items.map((item) => {
        const Icon = item.change ? ArrowRightIcon : MessageSquareIcon;
        return (
          <li key={item.id} className="flex gap-3">
            <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{item.actorName || "System"}</span>
                <span className="text-muted-foreground">, {formatDateTime(item.at)}</span>
              </p>
              {item.change ? <p className="font-medium">{item.change}</p> : null}
              {item.text ? <p className="break-words whitespace-pre-wrap">{item.text}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
