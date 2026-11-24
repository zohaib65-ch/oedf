import type { FILE_PURPOSES } from "@/lib/constants/enums";

/** Files an applicant or candidate may upload. Staff uploads (images, PDFs, agreements) come later. */
export const PUBLIC_UPLOAD_PURPOSES = [
  "APPLICATION_DOCUMENT",
  "CV",
] as const satisfies readonly (typeof FILE_PURPOSES)[number][];

export type PublicUploadPurpose = (typeof PUBLIC_UPLOAD_PURPOSES)[number];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** The formats and the folder for each purpose. Checked before signing and again after the upload. */
export const UPLOAD_RULES = {
  APPLICATION_DOCUMENT: {
    formats: ["pdf", "jpg", "jpeg", "png"],
    label: "PDF, JPG or PNG",
    folder: "applications",
  },
  CV: { formats: ["pdf", "docx"], label: "PDF or DOCX", folder: "cv" },
} as const satisfies Record<
  PublicUploadPurpose,
  { formats: readonly string[]; label: string; folder: string }
>;

export const RESOURCE_TYPES = ["image", "raw"] as const;

export type UploadResourceType = (typeof RESOURCE_TYPES)[number];

/** Cloudinary stores a Word file as a raw file and PDFs and pictures as images. */
export function getResourceType(format: string): UploadResourceType {
  return format === "docx" ? "raw" : "image";
}

/** The lower-case extension of a file name, or an empty string. */
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export const PENDING_TAG = "pending";
export const PENDING_MAX_AGE_HOURS = 24;
