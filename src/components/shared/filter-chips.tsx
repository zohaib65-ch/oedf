import { cn } from "cn";
import Link from "next/link";

interface FilterOption {
  label: string;
  href: string;
  isActive: boolean;
}

interface FilterChipsProps {
  /** Names the group for screen readers, for example "Category". */
  label: string;
  options: readonly FilterOption[];
}

/** A row of filter links. Filters are plain links, so every result page has its own shareable URL. */
export function FilterChips({ label, options }: FilterChipsProps) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-foreground">{label}:</span>
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.isActive ? "true" : undefined}
          scroll={false}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            option.isActive
              ? "border-navy bg-navy text-white"
              : "border-border bg-white text-foreground hover:border-navy",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
