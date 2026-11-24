import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import {
  findPublishedProgramBySlug,
  listPublishedPrograms,
} from "@/server/repositories/program.repository";

beforeEach(async () => {
  await connectDb();
  await Promise.all([ProgramModel.deleteMany({}), InstitutionModel.deleteMany({})]);
});

describe("program repository", () => {
  it("lists only published programs, filtered by category and ordered by title", async () => {
    await ProgramModel.create([
      { slug: "b", title: "B", category: "SKILLS", summary: "s", status: "PUBLISHED" },
      { slug: "a", title: "A", category: "SKILLS", summary: "s", status: "PUBLISHED" },
      { slug: "c", title: "C", category: "EDUCATION", summary: "s", status: "PUBLISHED" },
      { slug: "d", title: "D", category: "SKILLS", summary: "s", status: "DRAFT" },
    ]);

    const skills = await listPublishedPrograms({ category: "SKILLS" });
    expect(skills.map((program) => program.slug)).toEqual(["a", "b"]);
    expect(await listPublishedPrograms({})).toHaveLength(3);
    expect(await listPublishedPrograms({}, 1)).toHaveLength(1);
  });

  it("returns null for a draft and lists only active public institutions on a published one", async () => {
    const shown = await InstitutionModel.create({
      slug: "shown",
      name: "Shown",
      type: "SCHOOL",
      city: "Vehari",
      status: "ACTIVE",
      isPublic: true,
    });
    const hidden = await InstitutionModel.create({
      slug: "hidden",
      name: "Hidden",
      type: "SCHOOL",
      city: "Vehari",
      status: "PROPOSED",
      isPublic: true,
    });
    await ProgramModel.create([
      {
        slug: "live",
        title: "Live",
        category: "SKILLS",
        summary: "s",
        status: "PUBLISHED",
        institutionIds: [shown._id, hidden._id],
      },
      { slug: "draft", title: "Draft", category: "SKILLS", summary: "s", status: "DRAFT" },
    ]);

    const program = await findPublishedProgramBySlug("live");
    expect(program?.institutions).toEqual([{ slug: "shown", name: "Shown", city: "Vehari" }]);
    expect(await findPublishedProgramBySlug("draft")).toBeNull();
    expect(await findPublishedProgramBySlug("missing")).toBeNull();
  });
});
