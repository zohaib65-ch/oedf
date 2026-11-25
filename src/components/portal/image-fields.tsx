"use client";

import Image from "next/image";
import type { Control, FieldValues, Path } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { UploadField } from "@/components/forms/upload-field";

interface ImageFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** The saved image, shown so staff see what visitors see. */
  currentImage: { url: string; width: number; height: number; alt: string } | null;
}

/**
 * A record's public photo: the upload and its description for people who cannot see it. The form
 * fields are `image` and `imageAlt`; removing the upload removes the photo when the form is saved.
 */
export function ImageFields<T extends FieldValues>({ control, currentImage }: ImageFieldsProps<T>) {
  return (
    <div className="space-y-4">
      {currentImage ? (
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          width={currentImage.width}
          height={currentImage.height}
          sizes="320px"
          className="h-auto w-80 max-w-full rounded-lg border border-border"
        />
      ) : null}
      <UploadField
        control={control}
        name={"image" as Path<T>}
        label="Photo"
        purpose="IMAGE"
        description="Optional. JPG, PNG or WebP, up to 5 MB. Shown on the public page."
      />
      <TextField
        control={control}
        name={"imageAlt" as Path<T>}
        label="Photo description"
        placeholder="For example Students at a reading class"
        description="What the photo shows, for people who cannot see it. Needed with a photo."
        maxLength={200}
      />
    </div>
  );
}
