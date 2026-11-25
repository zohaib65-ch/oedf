"use client";

import { cn } from "cn";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ComboboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** The existing values to pick from. */
  options: readonly string[];
  /** What the list is of, for the search box and the "add" choice, for example "topic". */
  noun: string;
  description?: string;
}

/**
 * Picks one of the existing values, or adds a new one typed in the search box. Choosing from the
 * list keeps spelling consistent, so a typo does not start a second group.
 */
export function ComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  noun,
  description,
}: ComboboxFieldProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? "";
        const typed = search.trim();
        // A new value is offered only when it does not match an existing one, ignoring case.
        const isNew =
          typed !== "" && !options.some((option) => option.toLowerCase() === typed.toLowerCase());
        const choose = (next: string) => {
          field.onChange(next);
          setSearch("");
          setIsOpen(false);
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={fieldId(name)}
                  ref={field.ref}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(name, {
                    hasDescription: Boolean(description),
                    hasError: fieldState.invalid,
                  })}
                  onBlur={field.onBlur}
                  className="h-11 w-full justify-between font-normal"
                >
                  <span className={cn("truncate", value ? "" : "text-muted-foreground")}>
                    {value || `Choose or add a ${noun}`}
                  </span>
                  <ChevronsUpDownIcon className="opacity-60" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={`Search or type a new ${noun}`}
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No {noun}s yet. Type one to add it.</CommandEmpty>
                    {options.length > 0 ? (
                      <CommandGroup heading={`Existing ${noun}s`}>
                        {options.map((option) => (
                          <CommandItem
                            key={option}
                            value={option}
                            onSelect={() => {
                              choose(option);
                            }}
                          >
                            <CheckIcon
                              className={option === value ? "opacity-100" : "opacity-0"}
                              aria-hidden="true"
                            />
                            {option}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : null}
                    {isNew ? (
                      <CommandGroup heading={`New ${noun}`}>
                        <CommandItem
                          value={`add ${typed}`}
                          onSelect={() => {
                            choose(typed);
                          }}
                        >
                          <PlusIcon aria-hidden="true" />
                          Add “{typed}”
                        </CommandItem>
                      </CommandGroup>
                    ) : null}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description ? (
              <FieldDescription id={`${fieldId(name)}-description`}>{description}</FieldDescription>
            ) : null}
            {fieldState.invalid ? (
              <FieldError id={`${fieldId(name)}-error`} errors={[fieldState.error]} />
            ) : null}
          </Field>
        );
      }}
    />
  );
}
