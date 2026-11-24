import "server-only";

import type { DEPARTMENTS } from "@/lib/constants/departments";
import type { DEPARTMENT_CODES } from "@/lib/constants/enums";
import { DepartmentModel } from "@/server/db/models/department.model";

/**
 * Creates the offices that do not exist yet and leaves existing ones untouched, so edits made in
 * the portal (director name, notification email) survive a re-run. Returns how many were created.
 */
export async function ensureDepartments(seeds: typeof DEPARTMENTS): Promise<number> {
  const result = await DepartmentModel.bulkWrite(
    seeds.map((seed) => ({
      updateOne: {
        filter: { code: seed.code },
        update: { $setOnInsert: seed },
        upsert: true,
      },
    })),
  );
  return result.upsertedCount;
}

/** The ID of the office with the given code, or null. Used to find the Super Admin's office. */
export async function findDepartmentIdByCode(
  code: (typeof DEPARTMENT_CODES)[number],
): Promise<string | null> {
  const department = await DepartmentModel.findOne({ code }, { _id: 1 }).lean();
  return department ? department._id.toString() : null;
}
