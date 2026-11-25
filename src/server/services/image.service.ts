import "server-only";

import type { UploadedFile } from "@/lib/validations/common";
import { AppError } from "@/server/http/errors";
import { verifyUploads } from "@/server/services/upload-verification";
import {
  deletePublicImage,
  markUploadsConfirmed,
  publicImageUrl,
  type PublicImageWidth,
} from "@/server/storage/cloudinary";

/** An image as a record stores it: the Cloudinary ID, its size and its description. */
export interface StoredImage {
  publicId: string;
  width: number;
  height: number;
  alt: string;
}

/** An image ready for a page: a resized public link, its size and its description. */
export interface PublicImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Works out the image a form wants saved: none (removed), the current one (perhaps with a new
 * description) or a new upload, which is checked with Cloudinary first.
 */
export async function resolveImage(
  current: StoredImage | null,
  input: { image?: UploadedFile | undefined; imageAlt: string },
): Promise<StoredImage | null> {
  if (!input.image) {
    return null;
  }
  if (current && input.image.publicId === current.publicId) {
    return { ...current, alt: input.imageAlt };
  }
  const [verified] = await verifyUploads([{ field: "image", file: input.image }], "IMAGE");
  if (!verified?.width || !verified.height) {
    throw new AppError("VALIDATION_ERROR", "This image could not be read.", {
      fieldErrors: { image: ["This image could not be read. Upload it again."] },
    });
  }
  return {
    publicId: input.image.publicId,
    width: verified.width,
    height: verified.height,
    alt: input.imageAlt,
  };
}

/** After the record is saved: confirms a new image and deletes the one it replaced. */
export async function settleImage(
  previous: StoredImage | null,
  saved: StoredImage | null,
): Promise<void> {
  if (saved && saved.publicId !== previous?.publicId) {
    await markUploadsConfirmed([
      { publicId: saved.publicId, resourceType: "image", deliveryType: "upload" },
    ]);
  }
  if (previous && previous.publicId !== saved?.publicId) {
    await deletePublicImage(previous.publicId);
  }
}

/** A stored image as a sized public link, or null when the record has none. */
export function toPublicImage(
  image: StoredImage | null | undefined,
  width: PublicImageWidth,
): PublicImage | null {
  return image
    ? {
        url: publicImageUrl(image.publicId, width),
        width: image.width,
        height: image.height,
        alt: image.alt,
      }
    : null;
}
