import "server-only";

import { findSavedPublicIds } from "@/server/repositories/file-asset.repository";
import {
  deleteUploads,
  findStalePendingUploads,
  markUploadsConfirmed,
} from "@/server/storage/cloudinary";

export interface CleanupResult {
  deleted: number;
  /** Files that were saved but still carried the pending tag; the tag was removed instead. */
  untagged: number;
}

/**
 * Deletes uploads that were started and never submitted (still pending after 24 hours). A file the
 * database has saved is never deleted, even if its pending tag was left behind by a failed step.
 */
export async function cleanupStaleUploads(): Promise<CleanupResult> {
  const stale = await findStalePendingUploads();
  const saved = await findSavedPublicIds(stale.map(({ publicId }) => publicId));
  const abandoned = stale.filter(({ publicId }) => !saved.has(publicId));
  const forgotten = stale.filter(({ publicId }) => saved.has(publicId));

  await markUploadsConfirmed(forgotten);
  await deleteUploads(abandoned);
  return { deleted: abandoned.length, untagged: forgotten.length };
}
