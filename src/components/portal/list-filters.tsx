import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_FILTER_VALUE } from "@/lib/validations/common";

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
 */
export function FilterBar({ basePath, label, resetKey, sort, children }: FilterBarProps) {
  return (
    <form
      key={resetKey}
      method="get"
      action={basePath}
      role="search"
      aria-label={label}
      className="flex flex-wrap items-end gap-3"
    >
      {children}
      {sort ? <Input type="hidden" name="sort" value={sort} /> : null}
      <Button type="submit">Filter</Button>
      <Button asChild variant="ghost">
        <Link href={basePath}>Clear</Link>
      </Button>
    </form>
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
  className?: string;
}

export function FilterSelect({
  id,
  name,
  label,
  value,
  options,
  allLabel,
  className = "w-48",
}: FilterSelectProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={value ?? ALL_FILTER_VALUE}>
        <SelectTrigger id={id} className={className}>
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
    </div>
  );
}

interface FilterInputProps extends Omit<
  ComponentProps<typeof Input>,
  "id" | "name" | "defaultValue"
> {
  id: string;
  name: string;
  label: string;
  value: string | undefined;
}

export function FilterInput({
  id,
  name,
  label,
  value,
  className = "w-52",
  ...props
}: FilterInputProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={value} className={className} {...props} />
    </div>
  );
}
