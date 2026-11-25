"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { DatePicker } from "@/components/forms/date-picker";
import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

interface DateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
}

/** A labelled date picker bound to the form. The value is a YYYY-MM-DD day, or "" for none. */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
}: DateFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
          <DatePicker
            id={fieldId(name)}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
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
            <FieldError id={`${fieldId(name)}-error`}>
              {fieldErrorMessage(fieldState.error)}
            </FieldError>
          ) : null}
        </Field>
      )}
    />
  );
}
