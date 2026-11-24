import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import {
  findDepartmentBySlug,
  listDepartments,
  type DepartmentRecord,
} from "@/server/repositories/department.repository";

/** All offices in display order. */
export async function getDepartments(): Promise<DepartmentRecord[]> {
  "use cache";
  cacheTag(CACHE_TAGS.departments);
  cacheLife("hours");
  return listDepartments();
}

export async function getDepartment(slug: string): Promise<DepartmentRecord | null> {
  "use cache";
  cacheTag(CACHE_TAGS.departments);
  cacheLife("hours");
  return findDepartmentBySlug(slug);
}
