import { Badge } from "@/components/ui/badge";

export type StatusTone = "progress" | "positive" | "closed";

const VARIANT = { progress: "secondary", positive: "default", closed: "outline" } as const;

/** A status in a list or header. The text carries the meaning; the tone only helps scanning. */
export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return <Badge variant={VARIANT[tone]}>{label}</Badge>;
}
