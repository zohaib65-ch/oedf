"use client";

import { cn } from "cn";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState, type Ref } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay } from "@/lib/format";

/** The first year in the year dropdown, early enough for any date of birth. */
const FIRST_YEAR = 1940;
/** How far ahead the year dropdown reaches, for deadlines and renewals. */
const YEARS_AHEAD = 10;

/** A stored day (YYYY-MM-DD) as a local date, since the calendar works in the viewer's own days. */
function toDate(day: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) {
    return undefined;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** A day picked in the calendar as YYYY-MM-DD, the same text a native date input gives. */
function toDay(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The month grid. It reads today's year only once it is opened, so the page around it can still be
 * prerendered.
 */
function DayCalendar({
  selected,
  onSelect,
}: {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
}) {
  return (
    <Calendar
      mode="single"
      required
      selected={selected}
      defaultMonth={selected}
      onSelect={onSelect}
      captionLayout="dropdown"
      startMonth={new Date(FIRST_YEAR, 0)}
      endMonth={new Date(new Date().getFullYear() + YEARS_AHEAD, 11)}
      autoFocus
    />
  );
}

interface DatePickerProps {
  id: string;
  /** The chosen day as YYYY-MM-DD, or "" for none. Leave out to let the picker keep its own value. */
  value?: string;
  /** The first day when the picker keeps its own value, as in a filter form. */
  defaultValue?: string;
  onChange?: (day: string) => void;
  onBlur?: () => void;
  /** Set in a plain form: the day is sent under this name. */
  name?: string;
  ref?: Ref<HTMLButtonElement>;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * A button showing the chosen day ("24 November 2026") that opens a calendar, with month and year
 * dropdowns and a Clear button. The value is the YYYY-MM-DD text the schemas expect.
 */
export function DatePicker({
  id,
  value,
  defaultValue = "",
  onChange,
  onBlur,
  name,
  ref,
  placeholder = "Pick a date",
  className,
  ...aria
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ownValue, setOwnValue] = useState(defaultValue);
  const day = value ?? ownValue;
  const selected = toDate(day);

  const change = (next: string) => {
    setOwnValue(next);
    onChange?.(next);
    setIsOpen(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={ref}
            type="button"
            variant="outline"
            onBlur={onBlur}
            {...aria}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className={cn("truncate", selected ? "" : "text-muted-foreground")}>
              {selected ? formatDay(day) : placeholder}
            </span>
            <CalendarIcon className="opacity-60" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayCalendar
            selected={selected}
            onSelect={(date) => {
              change(toDay(date));
            }}
          />
          {selected ? (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  change("");
                }}
              >
                <XIcon aria-hidden="true" />
                Clear date
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {name ? <Input type="hidden" name={name} value={day} /> : null}
    </>
  );
}
