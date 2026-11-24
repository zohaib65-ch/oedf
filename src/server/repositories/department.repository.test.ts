import { beforeEach, describe, expect, it } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import {
  ensureDepartments,
  findDepartmentIdByCode,
} from "@/server/repositories/department.repository";

beforeEach(async () => {
  await connectDb();
  await DepartmentModel.deleteMany({});
});

describe("department repository", () => {
  it("creates the five offices once and leaves later edits untouched", async () => {
    expect(await ensureDepartments(DEPARTMENTS)).toBe(5);
    await DepartmentModel.updateOne({ code: "RESEARCH_POLICY" }, { directorName: "Dr Example" });

    expect(await ensureDepartments(DEPARTMENTS)).toBe(0);
    const research = await DepartmentModel.findOne({ code: "RESEARCH_POLICY" }).lean();
    expect(research?.directorName).toBe("Dr Example");
    expect(await DepartmentModel.countDocuments()).toBe(5);
  });

  it("finds an office id by code and returns null while the office does not exist", async () => {
    expect(await findDepartmentIdByCode("CEO_OFFICE")).toBeNull();

    await ensureDepartments(DEPARTMENTS);
    expect(await findDepartmentIdByCode("CEO_OFFICE")).toMatch(/^[0-9a-f]{24}$/);
  });
});
