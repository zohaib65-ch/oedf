import "server-only";

import { getFileExtension, UPLOAD_RULES } from "@/lib/constants/uploads";
import type { UploadPermission, UploadRequest } from "@/lib/validations/upload";
import { AppError } from "@/server/http/errors";
import { signUpload } from "@/server/storage/cloudinary";

/** Permission to upload one file: signed parameters for the allowed format, with a random file name. */
export function createUploadPermission({ purpose, fileName }: UploadRequest): UploadPermission {
  const extension = getFileExtension(fileName);
  const { formats, label } = UPLOAD_RULES[purpose];
  if (!(formats as readonly string[]).includes(extension)) {
    const message = `Upload a ${label} file.`;
    throw new AppError("VALIDATION_ERROR", message, { fieldErrors: { fileName: [message] } });
  }
  return signUpload(purpose, extension);
}
