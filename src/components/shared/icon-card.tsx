import type { LucideIcon } from "lucide-react";

interface IconCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** A white card with a navy icon circle: values, governance points, application steps. */
export function IconCard({ icon: Icon, title, description }: IconCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-card transition-shadow duration-300 hover:shadow-soft">
      <span className="flex size-14 items-center justify-center rounded-full bg-navy text-gold">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
