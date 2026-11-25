"use client";

import { FileCheck2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { fieldErrorMessage } from "@/components/forms/field-error-message";
import { describedBy, fieldId } from "@/components/forms/field-ids";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/client";
import { checkFile, uploadFile } from "@/lib/api/upload-file";
import { UPLOAD_RULES, type UploadPurpose } from "@/lib/constants/uploads";
import type { UploadedFile } from "@/lib/validations/common";

interface UploadFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  purpose: UploadPurpose;
  description?: string;
}

/**
 * A file input that uploads as soon as a file is chosen, straight to Cloudinary, with progress.
 * The form keeps only the uploaded file's reference; removing it clears the field.
 */
export function UploadField<T extends FieldValues>({
  control,
  name,
  label,
  purpose,
  description,
}: UploadFieldProps<T>) {
  const [progress, setProgress] = useState<number | undefined>();
  const [uploadError, setUploadError] = useState<string | undefined>();
  const hint = description ?? `${UPLOAD_RULES[purpose].label}, up to 5 MB.`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const uploaded = field.value as UploadedFile | null | undefined;
        const errorMessage =
          uploadError ?? (fieldState.invalid ? fieldErrorMessage(fieldState.error) : undefined);
        const isUploading = progress !== undefined;

        const handleChange = async (file: File | undefined) => {
          if (!file) {
            return;
          }
          const problem = checkFile(file, purpose);
          if (problem) {
            setUploadError(problem);
            return;
          }
          setUploadError(undefined);
          setProgress(0);
          try {
            field.onChange(await uploadFile(file, purpose, setProgress));
          } catch (error: unknown) {
            setUploadError(
              error instanceof ApiError ? error.message : "The upload failed. Please try again.",
            );
          } finally {
            setProgress(undefined);
          }
        };

        return (
          <Field data-invalid={Boolean(errorMessage)}>
            <FieldLabel htmlFor={fieldId(name)}>{label}</FieldLabel>
            {uploaded ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-input bg-white px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <FileCheck2Icon className="size-4 shrink-0 text-gold-text" aria-hidden="true" />
                  <span className="truncate">{uploaded.originalName}</span>
                  <span className="sr-only">uploaded</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // `null`, not `undefined`: react-hook-form reads `undefined` as "use the
                    // default", which would bring a saved file straight back.
                    field.onChange(null);
                  }}
                >
                  <Trash2Icon aria-hidden="true" />
                  Remove<span className="sr-only"> {label}</span>
                </Button>
              </div>
            ) : (
              <Input
                id={fieldId(name)}
                name={field.name}
                ref={field.ref}
                type="file"
                accept={UPLOAD_RULES[purpose].formats.map((format) => `.${format}`).join(",")}
                disabled={isUploading}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={describedBy(name, {
                  hasDescription: true,
                  hasError: Boolean(errorMessage),
                })}
                onChange={(event) => {
                  void handleChange(event.target.files?.[0]);
                }}
                className="h-auto cursor-pointer py-2"
              />
            )}
            {isUploading ? (
              <div className="flex items-center gap-3" role="status" aria-live="polite">
                <Progress value={progress} aria-label={`Uploading ${label}`} />
                <span className="text-sm tabular-nums">{progress}%</span>
              </div>
            ) : null}
            <FieldDescription id={`${fieldId(name)}-description`}>{hint}</FieldDescription>
            {errorMessage ? (
              <FieldError id={`${fieldId(name)}-error`}>{errorMessage}</FieldError>
            ) : null}
          </Field>
        );
      }}
    />
  );
}
