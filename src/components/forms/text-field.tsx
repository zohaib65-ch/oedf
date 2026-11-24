import type { ComponentProps } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  type?: ComponentProps<"input">["type"];
  autoComplete?: string;
  inputMode?: ComponentProps<"input">["inputMode"];
  placeholder?: string;
  maxLength?: number;
}

/** A labelled text input bound to the form, with its description and error linked for screen readers. */
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
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
          <Input
            {...field}
            value={field.value ?? ""}
            id={fieldId(name)}
            type={type}
            autoComplete={autoComplete}
            inputMode={inputMode}
            placeholder={placeholder}
            maxLength={maxLength}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(name, {
              hasDescription: Boolean(description),
              hasError: fieldState.invalid,
            })}
            className="h-11"
          />
          {description ? (
            <FieldDescription id={`${fieldId(name)}-description`}>{description}</FieldDescription>
          ) : null}
          {fieldState.invalid ? (
            <FieldError id={`${fieldId(name)}-error`} errors={[fieldState.error]} />
          ) : null}
        </Field>
      )}
    />
  );
}
