import "server-only";

import type { DEPARTMENTS } from "@/lib/constants/departments";
import type { DEPARTMENT_CODES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
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

export interface DepartmentRecord {
  id: string;
  code: (typeof DEPARTMENT_CODES)[number];
  slug: string;
  name: string;
  purpose: string;
  responsibilities: string[];
  /** Empty until a director is appointed. */
  directorName: string;
}

const PUBLIC_DEPARTMENT_FIELDS = {
  code: 1,
  slug: 1,
  name: 1,
  purpose: 1,
  responsibilities: 1,
  directorName: 1,
} as const;

function toDepartmentRecord(department: {
  _id: { toString(): string };
  code: (typeof DEPARTMENT_CODES)[number];
  slug: string;
  name: string;
  purpose: string;
  responsibilities: string[];
  directorName: string;
}): DepartmentRecord {
  return {
    id: department._id.toString(),
    code: department.code,
    slug: department.slug,
    name: department.name,
    purpose: department.purpose,
    responsibilities: department.responsibilities,
    directorName: department.directorName,
  };
}

/** All offices in display order. The notification email is never part of the public record. */
export async function listDepartments(): Promise<DepartmentRecord[]> {
  await connectDb();
  const departments = await DepartmentModel.find({}, PUBLIC_DEPARTMENT_FIELDS)
    .sort({ order: 1 })
    .lean();
  return departments.map(toDepartmentRecord);
}

export async function findDepartmentBySlug(slug: string): Promise<DepartmentRecord | null> {
  await connectDb();
  const department = await DepartmentModel.findOne({ slug }, PUBLIC_DEPARTMENT_FIELDS).lean();
  return department ? toDepartmentRecord(department) : null;
}
