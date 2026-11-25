import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { fieldId } from "@/components/forms/field-ids";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

interface CheckboxListFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  legend: string;
  options: readonly { value: string; label: string }[];
  description?: string;
  /** Shown instead of the boxes when there is nothing to choose. */
  emptyText: string;
}

/** Several choices from a list, one checkbox each. The value is the array of chosen values. */
export function CheckboxListField<T extends FieldValues>({
  control,
  name,
  legend,
  options,
  description,
  emptyText,
}: CheckboxListFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const chosen = new Set((field.value as string[] | undefined) ?? []);
        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">{legend}</FieldLegend>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((option) => {
                  const id = `${fieldId(name)}-${option.value}`;
                  return (
                    <Field key={option.value} orientation="horizontal">
                      <Checkbox
                        id={id}
                        checked={chosen.has(option.value)}
                        onCheckedChange={(checked) => {
                          const next = new Set(chosen);
                          if (checked === true) {
                            next.add(option.value);
                          } else {
                            next.delete(option.value);
                          }
                          field.onChange([...next]);
                        }}
                        onBlur={field.onBlur}
                      />
                      <FieldLabel htmlFor={id} className="font-normal">
                        {option.label}
                      </FieldLabel>
                    </Field>
                  );
                })}
              </div>
            )}
            {fieldState.invalid ? (
              <FieldError>{fieldErrorMessage(fieldState.error)}</FieldError>
            ) : null}
          </FieldSet>
        );
      }}
    />
  );
}
