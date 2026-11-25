import "server-only";
import { randomUUID } from "node:crypto";

import cloudinaryPackage from "cloudinary";

import { getServerEnv } from "@/env";
import {
  getFileExtension,
  getResourceType,
  MAX_UPLOAD_BYTES,
  PENDING_MAX_AGE_HOURS,
  PENDING_TAG,
  UPLOAD_RULES,
  type DeliveryType,
  type UploadPurpose,
  type UploadResourceType,
} from "@/lib/constants/uploads";
import type { UploadPermission } from "@/lib/validations/upload";
import { AppError } from "@/server/http/errors";
import { logger } from "@/server/lib/logger";

// Personal documents and agreements are private, "authenticated" assets: they can only be fetched
// with a signed link. Images for the public site are ordinary public uploads (`UPLOAD_RULES`).
// This is the only file that talks to the Cloudinary SDK.

const cloudinary = cloudinaryPackage.v2;
const PRIVATE_DELIVERY: DeliveryType = "authenticated";
const DELIVERY_TYPES: readonly DeliveryType[] = ["authenticated", "upload"];
const DOWNLOAD_LINK_LIFETIME_SECONDS = 5 * 60;
const LIST_PAGE_SIZE = 500;
const HOUR_MS = 60 * 60 * 1000;
const RESOURCE_TYPES_TO_CLEAN = ["image", "raw"] as const;

let isConfigured = false;

/** Configures the SDK from `CLOUDINARY_URL` the first time it is needed, and returns it. */
function getCloudinary() {
  if (!isConfigured) {
    const { CLOUDINARY_URL } = getServerEnv();
    if (!CLOUDINARY_URL) {
      logger.error("CLOUDINARY_URL is not set, so uploads are unavailable.");
      throw new AppError("INTERNAL_ERROR", "File uploads are not available right now.");
    }
    const url = new URL(CLOUDINARY_URL);
    cloudinary.config({
      cloud_name: url.hostname,
      api_key: decodeURIComponent(url.username),
      api_secret: decodeURIComponent(url.password),
      secure: true,
    });
    isConfigured = true;
  }
  return cloudinary;
}

/** One folder per environment (CLOUDINARY_FOLDER), so previews and development never mix with production. */
function getRootFolder(): string {
  return getServerEnv().CLOUDINARY_FOLDER;
}

function getPurposePrefix(purpose: UploadPurpose): string {
  return `${getRootFolder()}/${UPLOAD_RULES[purpose].folder}/`;
}

/**
 * Signed parameters for one browser upload. The server picks a random public ID, so the browser
 * cannot overwrite or guess another file. Format and size were already checked by the caller.
 */
export function signUpload(purpose: UploadPurpose, extension: string): UploadPermission {
  const sdk = getCloudinary();
  const resourceType = getResourceType(extension);
  // Word files are raw files, and a raw file's public ID keeps its extension.
  const publicId = `${getPurposePrefix(purpose)}${randomUUID()}${resourceType === "raw" ? `.${extension}` : ""}`;
  const allowedFormats = UPLOAD_RULES[purpose].formats.join(",");
  const deliveryType = UPLOAD_RULES[purpose].deliveryType;
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = {
    allowed_formats: allowedFormats,
    public_id: publicId,
    tags: PENDING_TAG,
    timestamp,
    type: deliveryType,
  };
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = sdk.config();

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    apiKey: apiKey ?? "",
    timestamp,
    signature: sdk.utils.api_sign_request(toSign, apiSecret ?? ""),
    publicId,
    type: deliveryType,
    tags: PENDING_TAG,
    allowedFormats,
    resourceType,
  };
}

export interface UploadReference {
  publicId: string;
  resourceType: UploadResourceType;
  /** Private unless said otherwise; public images are `upload`. */
  deliveryType?: DeliveryType;
}

export interface InspectedUpload {
  format: string;
  bytes: number;
  /** Pixel size, for images. */
  width?: number | undefined;
  height?: number | undefined;
}

interface CloudinaryResource {
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  type: string;
  tags?: string[];
  created_at: string;
  public_id: string;
}

function invalidFile(message: string): AppError {
  return new AppError("VALIDATION_ERROR", message);
}

/**
 * Looks the file up on Cloudinary and checks it again: it must be one this server signed (right
 * folder, private, still pending), in an allowed format and within the size limit.
 *
 * A file is deleted only when it is ours (right folder, still pending) and fails the format or size
 * check. Anything else is refused untouched: the public ID came from the browser, so it must never
 * be able to delete a file that was already saved or that this server did not sign.
 */
export async function inspectUpload(
  { publicId, resourceType }: UploadReference,
  purpose: UploadPurpose,
): Promise<InspectedUpload> {
  const { deliveryType } = UPLOAD_RULES[purpose];
  if (!publicId.startsWith(getPurposePrefix(purpose))) {
    throw invalidFile("One of the uploaded files is not valid. Please upload it again.");
  }
  const sdk = getCloudinary();

  let resource: CloudinaryResource;
  try {
    resource = (await sdk.api.resource(publicId, {
      resource_type: resourceType,
      type: deliveryType,
    })) as CloudinaryResource;
  } catch (error: unknown) {
    logger.warn({ err: error, publicId }, "Uploaded file could not be found on Cloudinary");
    throw invalidFile("One of the uploaded files could not be found. Please upload it again.");
  }

  const isPending = resource.tags?.includes(PENDING_TAG) ?? false;
  if (resource.type !== deliveryType || !isPending) {
    throw invalidFile("One of the uploaded files is not valid. Please upload it again.");
  }

  // A raw file has no format field; its extension is part of the public ID.
  const format = (resource.format ?? getFileExtension(publicId)).toLowerCase();
  const isAllowedFormat = (UPLOAD_RULES[purpose].formats as readonly string[]).includes(format);
  if (!isAllowedFormat || resource.bytes > MAX_UPLOAD_BYTES) {
    await deleteUploads([{ publicId, resourceType, deliveryType }]);
    throw invalidFile(
      isAllowedFormat
        ? "One of the uploaded files is larger than 5 MB."
        : "One of the uploaded files is not an accepted type.",
    );
  }
  return { format, bytes: resource.bytes, width: resource.width, height: resource.height };
}

/** Deletes files from Cloudinary. Callers pass only files that are ours and no longer used. Failures are logged, never thrown. */
export async function deleteUploads(references: readonly UploadReference[]): Promise<void> {
  const sdk = getCloudinary();
  await Promise.all(
    references.map(async ({ publicId, resourceType, deliveryType = PRIVATE_DELIVERY }) => {
      try {
        await sdk.uploader.destroy(publicId, {
          resource_type: resourceType,
          type: deliveryType,
          invalidate: true,
        });
      } catch (error: unknown) {
        logger.error({ err: error, publicId }, "Could not delete a rejected upload");
      }
    }),
  );
}

/** Removes the `pending` tag once the database has saved the file, so the cleanup job leaves it alone. */
export async function markUploadsConfirmed(references: readonly UploadReference[]): Promise<void> {
  const sdk = getCloudinary();
  await Promise.all(
    references.map(async ({ publicId, resourceType, deliveryType = PRIVATE_DELIVERY }) => {
      try {
        await sdk.uploader.remove_tag(PENDING_TAG, [publicId], {
          resource_type: resourceType,
          type: deliveryType,
        });
      } catch (error: unknown) {
        logger.error({ err: error, publicId }, "Could not remove the pending tag");
      }
    }),
  );
}

/** Pending files older than 24 hours: uploads that were started and never submitted. */
async function listStalePendingUploads(
  resourceType: UploadResourceType,
  deliveryType: DeliveryType,
): Promise<UploadReference[]> {
  const sdk = getCloudinary();
  const cutoff = Date.now() - PENDING_MAX_AGE_HOURS * HOUR_MS;
  const stale: UploadReference[] = [];
  let nextCursor: string | undefined;

  do {
    const page = (await sdk.api.resources({
      resource_type: resourceType,
      type: deliveryType,
      prefix: `${getRootFolder()}/`,
      tags: true,
      max_results: LIST_PAGE_SIZE,
      next_cursor: nextCursor,
    })) as { resources: CloudinaryResource[]; next_cursor?: string };

    for (const resource of page.resources) {
      const isPending = resource.tags?.includes(PENDING_TAG) ?? false;
      if (isPending && new Date(resource.created_at).getTime() < cutoff) {
        stale.push({ publicId: resource.public_id, resourceType, deliveryType });
      }
    }
    nextCursor = page.next_cursor;
  } while (nextCursor);

  return stale;
}

/** Every stale pending upload, across the file and delivery types the app uses. */
export async function findStalePendingUploads(): Promise<UploadReference[]> {
  const lists = await Promise.all(
    RESOURCE_TYPES_TO_CLEAN.flatMap((resourceType) =>
      DELIVERY_TYPES.map((deliveryType) => listStalePendingUploads(resourceType, deliveryType)),
    ),
  );
  return lists.flat();
}

interface DownloadableFile {
  publicId: string;
  resourceType: UploadResourceType;
  format: string;
}

/**
 * A signed link to a private file that stops working after 5 minutes. `cloudinary.url()` is never
 * used for these files, because its signed URLs do not expire.
 */
export function createPrivateDownloadUrl({
  publicId,
  resourceType,
  format,
}: DownloadableFile): string {
  return getCloudinary().utils.private_download_url(
    publicId,
    // A raw file's public ID already ends with its extension.
    resourceType === "raw" ? "" : format,
    {
      resource_type: resourceType,
      type: PRIVATE_DELIVERY,
      expires_at: Math.floor(Date.now() / 1000) + DOWNLOAD_LINK_LIFETIME_SECONDS,
    },
  );
}

/** The widths public images are served at: cards, page columns and wide banners. */
export type PublicImageWidth = 480 | 960 | 1600;

/**
 * The address of a public image, resized by Cloudinary to at most `width` pixels and served in the
 * best format for the browser. Only public (`upload`) images ever get such a link.
 */
export function publicImageUrl(publicId: string, width: PublicImageWidth): string {
  return getCloudinary().url(publicId, {
    secure: true,
    type: "upload",
    transformation: [{ width, crop: "limit", fetch_format: "auto", quality: "auto" }],
  });
}

/** Deletes a public image that a record no longer uses (it was replaced or removed). Logged, never thrown. */
export async function deletePublicImage(publicId: string): Promise<void> {
  await deleteUploads([{ publicId, resourceType: "image", deliveryType: "upload" }]);
}
