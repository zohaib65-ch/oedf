import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import {
  findPublicInstitutionBySlug,
  listPublicInstitutionCities,
  listPublicInstitutions,
} from "@/server/repositories/institution.repository";

const base = { type: "SCHOOL", city: "Vehari", status: "ACTIVE", isPublic: true } as const;

beforeEach(async () => {
  await connectDb();
  await Promise.all([InstitutionModel.deleteMany({}), ProgramModel.deleteMany({})]);
});

describe("institution repository", () => {
  it("shows only active institutions marked public, filtered by city and type", async () => {
    await InstitutionModel.create([
      { ...base, slug: "a", name: "A" },
      { ...base, slug: "b", name: "B", city: "Multan", type: "COLLEGE" },
      { ...base, slug: "c", name: "C", isPublic: false },
      { ...base, slug: "d", name: "D", status: "PROPOSED" },
    ]);

    expect((await listPublicInstitutions({})).map((i) => i.slug)).toEqual(["a", "b"]);
    expect((await listPublicInstitutions({ city: "Multan" })).map((i) => i.slug)).toEqual(["b"]);
    expect((await listPublicInstitutions({ type: "SCHOOL" })).map((i) => i.slug)).toEqual(["a"]);
    expect(await listPublicInstitutionCities()).toEqual(["Multan", "Vehari"]);
  });

  it("never exposes agreements or reviews, and lists only published programs", async () => {
    const institution = await InstitutionModel.create({
      ...base,
      slug: "a",
      name: "A",
      agreements: [{ title: "MoU", partner: "Secret partner", startDate: new Date() }],
    });
    await ProgramModel.create([
      {
        slug: "p1",
        title: "P1",
        category: "SKILLS",
        summary: "s",
        status: "PUBLISHED",
        institutionIds: [institution._id],
      },
      {
        slug: "p2",
        title: "P2",
        category: "SKILLS",
        summary: "s",
        status: "DRAFT",
        institutionIds: [institution._id],
      },
    ]);

    const detail = await findPublicInstitutionBySlug("a");
    expect(detail?.programs).toEqual([{ slug: "p1", title: "P1" }]);
    expect(JSON.stringify(detail)).not.toContain("Secret partner");
    expect(await findPublicInstitutionBySlug("missing")).toBeNull();
  });
});
