import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  rows?: number;
  maxLength?: number;
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  rows = 5,
  maxLength,
}: TextareaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
          <Textarea
            {...field}
            value={field.value ?? ""}
            id={fieldId(name)}
            rows={rows}
            maxLength={maxLength}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(name, {
              hasDescription: Boolean(description),
              hasError: fieldState.invalid,
            })}
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
