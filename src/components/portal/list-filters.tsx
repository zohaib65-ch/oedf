import { cn } from "cn";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_FILTER_VALUE } from "@/lib/validations/common";

/** How much room a filter takes: one grid column, or two (the full row on a phone). */
type FilterSize = "md" | "lg";

const FIELD_SIZE: Record<FilterSize, string> = {
  md: "",
  lg: "col-span-full sm:col-span-2",
};
// Select sets its height through `data-size`, so its height is set the same way to match inputs.
const CONTROL = "h-10 w-full bg-background data-[size=default]:h-10";

interface FilterBarProps {
  /** The list page; Clear goes back to it without filters. */
  basePath: string;
  /** Accessible name of the filter form. */
  label: string;
  /** Changes when the applied filters change, so the fields never keep showing old values. */
  resetKey: string;
  /** Kept when filtering, so the chosen order survives a new filter. */
  sort?: string | undefined;
  children: ReactNode;
}

/**
 * A plain GET form: the filters live in the URL, so a list can be shared and bookmarked, and it
 * works before any JavaScript has loaded. Filtering always starts again at page 1.
 *
 * The fields sit in a card on a grid of equal columns (as many as fit, at least 8rem each; two on a
 * phone), all the same height, so they line up in one row when there is room and wrap neatly when
 * there is not. Filter and Clear stay at the end of that row; on a phone they go below, full width.
 */
export function FilterBar({ basePath, label, resetKey, sort, children }: FilterBarProps) {
  return (
    <form
      key={resetKey}
      method="get"
      action={basePath}
      role="search"
      aria-label={label}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] items-end gap-3 sm:grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]">
        {children}
      </div>
      {sort ? <Input type="hidden" name="sort" value={sort} /> : null}
      <div className="flex shrink-0 gap-2">
        <Button type="submit" className="h-10 flex-1 px-4 sm:flex-none">
          <FilterIcon aria-hidden="true" />
          Filter
        </Button>
        <Button asChild variant="outline" className="h-10 flex-1 px-4 sm:flex-none">
          <Link href={basePath}>
            <XIcon aria-hidden="true" />
            Clear
          </Link>
        </Button>
      </div>
    </form>
  );
}

/** A label above its control. Flex with a gap (not margins), so Select's hidden native field adds no height. */
function FilterField({
  id,
  label,
  size,
  children,
}: {
  id: string;
  label: string;
  size: FilterSize;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", FIELD_SIZE[size])}>
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

interface FilterSelectProps {
  id: string;
  name: string;
  label: string;
  value: string | undefined;
  options: readonly { value: string; label: string }[];
  /** The first choice, meaning no filter, for example "All statuses". */
  allLabel: string;
  size?: FilterSize;
}

export function FilterSelect({
  id,
  name,
  label,
  value,
  options,
  allLabel,
  size = "md",
}: FilterSelectProps) {
  return (
    <FilterField id={id} label={label} size={size}>
      <Select name={name} defaultValue={value ?? ALL_FILTER_VALUE}>
        <SelectTrigger id={id} className={CONTROL}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER_VALUE}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

interface FilterInputProps extends Omit<
  ComponentProps<typeof Input>,
  "id" | "name" | "defaultValue" | "size" | "className"
> {
  id: string;
  name: string;
  label: string;
  value: string | undefined;
  size?: FilterSize;
}

/** A text or date filter. The free-text search (`q`) gets a search icon and the wider size. */
export function FilterInput({ id, name, label, value, size, ...props }: FilterInputProps) {
  const isSearch = name === "q";
  return (
    <FilterField id={id} label={label} size={size ?? (isSearch ? "lg" : "md")}>
      {isSearch ? (
        <InputGroup className={CONTROL}>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput id={id} name={name} defaultValue={value} {...props} />
        </InputGroup>
      ) : (
        <Input id={id} name={name} defaultValue={value} className={CONTROL} {...props} />
      )}
    </FilterField>
  );
}
