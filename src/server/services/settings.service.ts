import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import type { UpdateDepartmentInput, UpdateSettingsInput } from "@/lib/validations/settings";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  listDepartmentsForStaff,
  updateDepartmentDetails,
  type StaffDepartmentRecord,
} from "@/server/repositories/department.repository";
import {
  findPublicSiteSettings,
  saveSiteSettings,
  type PublicSiteSettingsRecord,
} from "@/server/repositories/site-settings.repository";
import { recordAudit } from "@/server/services/audit-log.service";

export async function getSiteSettings(): Promise<PublicSiteSettingsRecord> {
  const settings = await findPublicSiteSettings();
  if (!settings) {
    throw new AppError("NOT_FOUND", "The settings have not been created. Run `npm run db:seed`.");
  }
  return settings;
}

// The site is rendered from cached reads, so a saved change must expire them at once. Route
// handlers cannot use `updateTag`, so `revalidateTag` with `expire: 0` is used instead.
const EXPIRE_NOW = { expire: 0 } as const;

export async function updateSiteSettings(
  staff: StaffContext,
  input: UpdateSettingsInput,
): Promise<PublicSiteSettingsRecord> {
  const changedSections = await saveSiteSettings(input);
  if (changedSections.length > 0) {
    await recordAudit(staff, {
      action: "settings.updated",
      entityType: "Settings",
      entityId: "site",
      metadata: { sections: changedSections.join(", ") },
    });
    revalidateTag(CACHE_TAGS.settings, EXPIRE_NOW);
  }
  return getSiteSettings();
}

export function getDepartmentsForStaff(): Promise<StaffDepartmentRecord[]> {
  return listDepartmentsForStaff();
}

export async function updateDepartment(
  staff: StaffContext,
  id: string,
  input: UpdateDepartmentInput,
): Promise<StaffDepartmentRecord> {
  const changed = /^[0-9a-f]{24}$/.test(id) ? await updateDepartmentDetails(id, input) : null;
  if (changed === null) {
    throw new AppError("NOT_FOUND", "This office could not be found.");
  }
  if (changed.length > 0) {
    await recordAudit(staff, {
      action: "department.updated",
      entityType: "Department",
      entityId: id,
      metadata: { fields: changed.join(", ") },
    });
    revalidateTag(CACHE_TAGS.departments, EXPIRE_NOW);
  }
  const updated = (await listDepartmentsForStaff()).find((department) => department.id === id);
  if (!updated) {
    throw new AppError("NOT_FOUND", "This office could not be found.");
  }
  return updated;
}
