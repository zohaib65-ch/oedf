import type { ReactNode } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface CheckboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  children: ReactNode;
  isDisabled?: boolean;
}

/** A single checkbox with its sentence, for a declaration. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  children,
  isDisabled = false,
}: CheckboxFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            id={fieldId(name)}
            name={field.name}
            ref={field.ref}
            checked={field.value === true}
            disabled={isDisabled}
            onCheckedChange={(checked) => {
              field.onChange(checked === true);
            }}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(name, {
              hasDescription: false,
              hasError: fieldState.invalid,
            })}
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={fieldId(name)} className="font-normal">
              {children}
            </FieldLabel>
            {fieldState.invalid ? (
              <FieldError id={`${fieldId(name)}-error`}>
                {fieldErrorMessage(fieldState.error)}
              </FieldError>
            ) : null}
          </div>
        </Field>
      )}
    />
  );
}
