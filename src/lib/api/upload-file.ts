import { apiPost, ApiError } from "@/lib/api/client";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_RULES,
  getFileExtension,
  type PublicUploadPurpose,
} from "@/lib/constants/uploads";
import type { UploadedFile } from "@/lib/validations/common";
import type { UploadPermission } from "@/lib/validations/upload";

/** Checks a chosen file in the browser, before anything is sent. Returns a message, or undefined when fine. */
export function checkFile(file: File, purpose: PublicUploadPurpose): string | undefined {
  const { formats, label } = UPLOAD_RULES[purpose];
  if (!(formats as readonly string[]).includes(getFileExtension(file.name))) {
    return `Choose a ${label} file.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "The file is larger than 5 MB.";
  }
  return undefined;
}

function sendToCloudinary(
  permission: UploadPermission,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.set("file", file);
    form.set("api_key", permission.apiKey);
    form.set("timestamp", String(permission.timestamp));
    form.set("signature", permission.signature);
    form.set("public_id", permission.publicId);
    form.set("type", permission.type);
    form.set("tags", permission.tags);
    form.set("allowed_formats", permission.allowedFormats);

    const request = new XMLHttpRequest();
    request.open("POST", permission.uploadUrl);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(
          new ApiError("UPLOAD_FAILED", "The upload failed. Please try again.", request.status),
        );
      }
    });
    request.addEventListener("error", () => {
      reject(
        new ApiError(
          "NETWORK_ERROR",
          "We could not reach the upload service. Check your connection.",
          0,
        ),
      );
    });
    request.send(form);
  });
}

/**
 * Uploads one file straight to Cloudinary with a signature from our server, so the file never
 * passes through the website's server. Reports progress as a percentage.
 */
export async function uploadFile(
  file: File,
  purpose: PublicUploadPurpose,
  onProgress: (percent: number) => void,
): Promise<UploadedFile> {
  const permission = await apiPost<UploadPermission>("/uploads", {
    purpose,
    fileName: file.name,
    bytes: file.size,
  });
  await sendToCloudinary(permission, file, onProgress);
  return {
    publicId: permission.publicId,
    resourceType: permission.resourceType,
    originalName: file.name,
  };
}
