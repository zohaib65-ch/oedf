import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import {
  findPublishedVacancyBySlug,
  listOpenVacancies,
  listOpenVacancyCities,
} from "@/server/repositories/vacancy.repository";

const DAY_MS = 86_400_000;
const future = () => new Date(Date.now() + 7 * DAY_MS);
const past = () => new Date(Date.now() - DAY_MS);

let departmentId = "";

beforeEach(async () => {
  await connectDb();
  await Promise.all([VacancyModel.deleteMany({}), DepartmentModel.deleteMany({})]);
  const department = await DepartmentModel.create({
    code: "HR_TEACHER_MANAGEMENT",
    slug: "hr",
    name: "HR",
    purpose: "p",
    order: 1,
  });
  departmentId = department._id.toString();
});

interface VacancyOverrides {
  city?: string;
  employmentType?: "FULL_TIME" | "CONTRACT";
  deadline?: Date;
  status?: "DRAFT" | "PUBLISHED";
}

function vacancy(slug: string, overrides: VacancyOverrides = {}) {
  return {
    slug,
    title: slug,
    departmentId,
    city: "Vehari",
    employmentType: "FULL_TIME" as const,
    description: "d",
    deadline: future(),
    status: "PUBLISHED" as const,
    ...overrides,
  };
}

describe("vacancy repository", () => {
  it("lists published vacancies whose deadline has not passed, soonest first", async () => {
    await VacancyModel.create([
      vacancy("later", { deadline: new Date(Date.now() + 9 * DAY_MS) }),
      vacancy("sooner", { deadline: new Date(Date.now() + 2 * DAY_MS) }),
      vacancy("expired", { deadline: past() }),
      vacancy("draft", { status: "DRAFT" }),
    ]);

    const open = await listOpenVacancies({});
    expect(open.map((v) => v.slug)).toEqual(["sooner", "later"]);
    expect(open[0]?.departmentName).toBe("HR");
  });

  it("filters by department, city and type, and returns nothing for an unknown department", async () => {
    await VacancyModel.create([
      vacancy("a"),
      vacancy("b", { city: "Multan", employmentType: "CONTRACT" }),
    ]);

    expect((await listOpenVacancies({ city: "Multan" })).map((v) => v.slug)).toEqual(["b"]);
    expect((await listOpenVacancies({ type: "FULL_TIME" })).map((v) => v.slug)).toEqual(["a"]);
    expect(await listOpenVacancies({ department: "hr" })).toHaveLength(2);
    expect(await listOpenVacancies({ department: "unknown" })).toEqual([]);
    expect(await listOpenVacancyCities()).toEqual(["Multan", "Vehari"]);
  });

  it("still shows an expired published vacancy on its own page, but never a draft", async () => {
    await VacancyModel.create([
      vacancy("expired", { deadline: past() }),
      vacancy("draft", { status: "DRAFT" }),
    ]);

    expect((await findPublishedVacancyBySlug("expired"))?.slug).toBe("expired");
    expect(await findPublishedVacancyBySlug("draft")).toBeNull();
  });
});
