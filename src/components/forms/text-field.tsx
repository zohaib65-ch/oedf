import type { ChangeEvent, ComponentProps } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { describedBy, fieldId } from "@/components/forms/field-ids";
import { PasswordInput } from "@/components/forms/password-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  autoComplete?: string;
  inputMode?: ComponentProps<"input">["inputMode"];
  maxLength?: number;
  /**
   * For a comma-separated list: no item can be typed or pasted longer than `max`, and a red note
   * says when one is full. `noun` names an item in that note, for example "topic".
   */
  itemLimit?: { max: number; noun: string };
} &
  // The browser draws its own --:-- hint in a time input, so a placeholder never shows.
  (
    | { type: "time"; placeholder?: never }
    | { type?: "text" | "email" | "tel" | "number" | "password" | "url"; placeholder: string }
  );

/** Cuts every comma-separated item to `max` characters (its leading space not counted). */
function capItems(value: string, max: number): string {
  return value
    .split(",")
    .map((item) => item.slice(0, item.length - item.trimStart().length + max))
    .join(",");
}

/** True when some comma-separated item has reached `max` characters, so typing more is blocked. */
function hasFullItem(value: unknown, max: number): boolean {
  return (
    typeof value === "string" && value.split(",").some((item) => item.trimStart().length >= max)
  );
}

/**
 * A labelled text input bound to the form, with its description and error linked for screen readers.
 * A password gets an eye button to show or hide it. Every typed input needs a placeholder. A date
 * is a `DateField` (the shadcn calendar), never a native date input.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  itemLimit,
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const isItemFull = itemLimit ? hasFullItem(field.value, itemLimit.max) : false;
        // A real error wins; otherwise a full item gets its own note in the same place.
        const errorText = fieldState.invalid
          ? fieldErrorMessage(fieldState.error)
          : isItemFull && itemLimit
            ? `This ${itemLimit.noun} is full: ${String(itemLimit.max)} characters at most. Type a comma to start the next ${itemLimit.noun}.`
            : undefined;
        const inputProps = {
          ...field,
          value: field.value ?? "",
          onChange: itemLimit
            ? (event: ChangeEvent<HTMLInputElement>) => {
                field.onChange(capItems(event.target.value, itemLimit.max));
              }
            : field.onChange,
          id: fieldId(name),
          autoComplete,
          inputMode,
          placeholder,
          maxLength,
          "aria-invalid": fieldState.invalid,
          "aria-describedby": describedBy(name, {
            hasDescription: Boolean(description),
            hasError: errorText !== undefined,
          }),
          className: "h-11",
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
            {type === "password" ? (
              <PasswordInput {...inputProps} />
            ) : (
              <Input {...inputProps} type={type} />
            )}
            {description ? (
              <FieldDescription id={`${fieldId(name)}-description`}>{description}</FieldDescription>
            ) : null}
            {errorText ? <FieldError id={`${fieldId(name)}-error`}>{errorText}</FieldError> : null}
          </Field>
        );
      }}
    />
  );
}
