import "server-only";

import { hasPermission, type Permission } from "@/lib/constants/permissions";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { FILE_OWNER_TYPES, findFileAssetById } from "@/server/repositories/file-asset.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { createPrivateDownloadUrl } from "@/server/storage/cloudinary";

// A file belongs to a record, and may be opened by whoever may read that kind of record.
const PERMISSION_FOR_OWNER: Record<string, Permission> = {
  [FILE_OWNER_TYPES.application]: "applications:read",
  [FILE_OWNER_TYPES.jobApplication]: "job-applications:read",
  [FILE_OWNER_TYPES.institution]: "institutions:read",
};

/** A link to a private file that expires after 5 minutes. Every access is written to the audit log. */
export async function getFileDownloadUrl(staff: StaffContext, fileId: string): Promise<string> {
  const file = /^[0-9a-f]{24}$/.test(fileId) ? await findFileAssetById(fileId) : null;
  if (!file) {
    throw new AppError("NOT_FOUND", "This file could not be found.");
  }
  const permission = PERMISSION_FOR_OWNER[file.ownerType];
  if (!permission || !hasPermission(staff, permission)) {
    throw new AppError("FORBIDDEN", "You do not have access to this file.");
  }

  await recordAudit(staff, {
    action: "file.opened",
    entityType: file.ownerType,
    entityId: file.ownerId,
    metadata: { fileId: file.id },
  });
  return createPrivateDownloadUrl(file);
}
