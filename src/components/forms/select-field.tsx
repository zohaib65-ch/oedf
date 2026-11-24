import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Choose one",
  description,
}: SelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
          <Select name={field.name} value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger
              id={fieldId(name)}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={describedBy(name, {
                hasDescription: Boolean(description),
                hasError: fieldState.invalid,
              })}
              className="h-11 w-full"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
