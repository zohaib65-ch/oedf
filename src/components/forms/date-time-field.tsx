"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { DatePicker } from "@/components/forms/date-picker";
import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface DateTimeFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
}

/**
 * A date picker and a time input side by side, bound to one field. The value is the local
 * date and time as YYYY-MM-DDTHH:mm (what a native datetime input gives), or "" for none.
 */
export function DateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: DateTimeFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const [date = "", time = ""] = ((field.value as string | undefined) ?? "").split("T");
        // Half a value (only a date or only a time) stays as typed, so the schema can say what is missing.
        const change = (nextDate: string, nextTime: string) => {
          field.onChange(nextDate || nextTime ? `${nextDate}T${nextTime}` : "");
        };
        const aria = {
          "aria-invalid": fieldState.invalid,
          "aria-describedby": describedBy(name, {
            hasDescription: Boolean(description),
            hasError: fieldState.invalid,
          }),
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
            <div className="flex gap-2">
              <DatePicker
                id={fieldId(name)}
                ref={field.ref}
                value={date}
                onChange={(nextDate) => {
                  change(nextDate, time);
                }}
                onBlur={field.onBlur}
                {...aria}
                className="h-11 flex-1"
              />
              <Input
                type="time"
                aria-label={`${label}: time`}
                value={time}
                onChange={(event) => {
                  change(date, event.target.value);
                }}
                onBlur={field.onBlur}
                {...aria}
                className="h-11 w-32 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
            {description ? (
              <FieldDescription id={`${fieldId(name)}-description`}>{description}</FieldDescription>
            ) : null}
            {fieldState.invalid ? (
              <FieldError id={`${fieldId(name)}-error`}>
                {fieldErrorMessage(fieldState.error)}
              </FieldError>
            ) : null}
          </Field>
        );
      }}
    />
  );
}
