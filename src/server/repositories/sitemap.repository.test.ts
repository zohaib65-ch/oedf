import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { listSitemapRecords } from "@/server/repositories/sitemap.repository";

beforeEach(async () => {
  await connectDb();
  await Promise.all([ProgramModel.deleteMany({}), InstitutionModel.deleteMany({})]);
});

describe("sitemap repository", () => {
  it("lists only the detail pages the public site can show", async () => {
    await ProgramModel.create([
      { slug: "live", title: "Live", category: "SKILLS", summary: "s", status: "PUBLISHED" },
      { slug: "draft", title: "Draft", category: "SKILLS", summary: "s", status: "DRAFT" },
    ]);
    await InstitutionModel.create({
      slug: "hidden",
      name: "H",
      type: "SCHOOL",
      city: "V",
      status: "ACTIVE",
      isPublic: false,
    });

    const records = await listSitemapRecords();
    expect(records.programs.map((r) => r.slug)).toEqual(["live"]);
    expect(records.institutions).toEqual([]);
    expect(records.news).toEqual([]);
  });
});
