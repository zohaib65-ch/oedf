import "server-only";

import type { UploadPurpose } from "@/lib/constants/uploads";
import type { UploadedFile } from "@/lib/validations/common";
import { AppError } from "@/server/http/errors";
import { findSavedPublicIds } from "@/server/repositories/file-asset.repository";
import { inspectUpload, type InspectedUpload } from "@/server/storage/cloudinary";

export interface UploadToVerify {
  /** The form field the file came from, so an error can point at it (for example `documents.photo`). */
  field: string;
  file: UploadedFile;
}

export interface VerifiedUpload extends InspectedUpload {
  field: string;
  file: UploadedFile;
}

/**
 * Confirms every file with Cloudinary before anything is saved. The error names the field of each
 * file that failed. A rejected file that was ours is already deleted by `inspectUpload`; files that
 * passed stay, so the visitor can fix the problem and submit again.
 */
export async function verifyUploads(
  uploads: readonly UploadToVerify[],
  purpose: UploadPurpose,
): Promise<VerifiedUpload[]> {
  const publicIds = uploads.map(({ file }) => file.publicId);
  if (new Set(publicIds).size !== publicIds.length) {
    throw new AppError("VALIDATION_ERROR", "Each document needs its own file.");
  }
  const alreadySaved = await findSavedPublicIds(publicIds);

  const results = await Promise.allSettled(
    uploads.map(async (upload) => {
      if (alreadySaved.has(upload.file.publicId)) {
        throw new AppError(
          "VALIDATION_ERROR",
          "This file was already used. Please upload it again.",
        );
      }
      return { ...upload, ...(await inspectUpload(upload.file, purpose)) };
    }),
  );

  const fieldErrors: Record<string, string[]> = {};
  const verified: VerifiedUpload[] = [];
  results.forEach((result, index) => {
    const upload = uploads[index];
    if (!upload) {
      return;
    }
    if (result.status === "fulfilled") {
      verified.push(result.value);
      return;
    }
    const message =
      result.reason instanceof AppError ? result.reason.message : "This file could not be checked.";
    fieldErrors[upload.field] = [message];
  });

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION_ERROR", "Some files were not accepted.", { fieldErrors });
  }
  return verified;
}
