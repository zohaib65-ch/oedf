import "server-only";

import type { DEPARTMENT_CODES } from "@/lib/constants/enums";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { createAuditEntry } from "@/server/repositories/audit-log.repository";
import { findDepartmentCodeById } from "@/server/repositories/department.repository";
import { FILE_OWNER_TYPES, findFileAssetById } from "@/server/repositories/file-asset.repository";
import { createPrivateDownloadUrl } from "@/server/storage/cloudinary";

// Until the permission map arrives (Phase 5), a file is open to Super Admin, the CEO Office and the
// staff of the office that handles the record it belongs to. Everyone else is refused.
const OFFICE_FOR_OWNER: Record<string, (typeof DEPARTMENT_CODES)[number]> = {
  [FILE_OWNER_TYPES.application]: "ADMISSIONS_SCHOLARSHIPS",
  [FILE_OWNER_TYPES.jobApplication]: "HR_TEACHER_MANAGEMENT",
};
const ROLES_WITH_ALL_ACCESS = new Set(["SUPER_ADMIN", "CEO_OFFICE"]);

interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

async function canOpen(staff: StaffContext, ownerType: string): Promise<boolean> {
  if (ROLES_WITH_ALL_ACCESS.has(staff.role)) {
    return true;
  }
  const owningOffice = OFFICE_FOR_OWNER[ownerType];
  const ownOffice = staff.departmentId ? await findDepartmentCodeById(staff.departmentId) : null;
  return owningOffice !== undefined && owningOffice === ownOffice;
}

/** A link to a private file that expires after 5 minutes. Every access is written to the audit log. */
export async function getFileDownloadUrl(
  staff: StaffContext,
  fileId: string,
  meta: RequestMeta,
): Promise<string> {
  const file = /^[0-9a-f]{24}$/.test(fileId) ? await findFileAssetById(fileId) : null;
  if (!file) {
    throw new AppError("NOT_FOUND", "This file could not be found.");
  }
  if (!(await canOpen(staff, file.ownerType))) {
    throw new AppError("FORBIDDEN", "You do not have access to this file.");
  }

  await createAuditEntry({
    actorId: staff.id,
    actorName: staff.name,
    action: "file.opened",
    entityType: file.ownerType,
    entityId: file.ownerId,
    metadata: { fileId: file.id },
    ...meta,
  });
  return createPrivateDownloadUrl(file);
}
