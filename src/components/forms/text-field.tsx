import type { ComponentProps } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

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
} &
  // The browser draws its own --:-- hint in a time input, so a placeholder never shows.
  (
    | { type: "time"; placeholder?: never }
    | { type?: "text" | "email" | "tel" | "number" | "password" | "url"; placeholder: string }
  );

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
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const inputProps = {
          ...field,
          value: field.value ?? "",
          id: fieldId(name),
          autoComplete,
          inputMode,
          placeholder,
          maxLength,
          "aria-invalid": fieldState.invalid,
          "aria-describedby": describedBy(name, {
            hasDescription: Boolean(description),
            hasError: fieldState.invalid,
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
            {fieldState.invalid ? (
              <FieldError id={`${fieldId(name)}-error`} errors={[fieldState.error]} />
            ) : null}
          </Field>
        );
      }}
    />
  );
}
