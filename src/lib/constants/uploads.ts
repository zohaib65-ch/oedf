import type { FILE_PURPOSES } from "@/lib/constants/enums";

/** Files an applicant or candidate may upload. */
const PUBLIC_UPLOAD_PURPOSES = [
  "APPLICATION_DOCUMENT",
  "CV",
] as const satisfies readonly (typeof FILE_PURPOSES)[number][];

/** Files staff upload from the portal: public images and private agreement documents. */
export const STAFF_UPLOAD_PURPOSES = [
  "IMAGE",
  "AGREEMENT",
] as const satisfies readonly (typeof FILE_PURPOSES)[number][];

export const UPLOAD_PURPOSES = [...PUBLIC_UPLOAD_PURPOSES, ...STAFF_UPLOAD_PURPOSES] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

/**
 * How Cloudinary serves a file: `authenticated` only through a signed, expiring link (personal
 * documents and agreements), `upload` openly (images shown on the public site).
 */
export type DeliveryType = "authenticated" | "upload";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** The formats, folder and delivery for each purpose. Checked before signing and again after the upload. */
export const UPLOAD_RULES = {
  APPLICATION_DOCUMENT: {
    formats: ["pdf", "jpg", "jpeg", "png"],
    label: "PDF, JPG or PNG",
    folder: "applications",
    deliveryType: "authenticated",
  },
  CV: {
    formats: ["pdf", "docx"],
    label: "PDF or DOCX",
    folder: "cv",
    deliveryType: "authenticated",
  },
  IMAGE: {
    formats: ["jpg", "jpeg", "png", "webp"],
    label: "JPG, PNG or WebP",
    folder: "images",
    deliveryType: "upload",
  },
  AGREEMENT: {
    formats: ["pdf"],
    label: "PDF",
    folder: "agreements",
    deliveryType: "authenticated",
  },
} as const satisfies Record<
  UploadPurpose,
  { formats: readonly string[]; label: string; folder: string; deliveryType: DeliveryType }
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
