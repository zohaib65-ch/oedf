import type { ReactNode } from "react";

interface DetailListProps {
  items: readonly { label: string; value: ReactNode }[];
  /** Two columns on larger screens (the default), or one for a narrow side panel. */
  columns?: 1 | 2;
}

/** Label and value pairs, two columns wide on larger screens. Empty values show a dash. */
export function DetailList({ items, columns = 2 }: DetailListProps) {
  return (
    <dl className={columns === 2 ? "grid gap-x-6 gap-y-4 sm:grid-cols-2" : "grid gap-y-4"}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 font-medium break-words">{item.value === "" ? "—" : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
