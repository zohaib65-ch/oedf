import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { PublicationModel } from "@/server/db/models/publication.model";
import {
  findPublishedPublicationBySlug,
  listLatestPublications,
  listPublicationYears,
  listPublishedPublications,
} from "@/server/repositories/publication.repository";

const base = { type: "RESEARCH_REPORT", status: "PUBLISHED" } as const;

beforeAll(async () => {
  await connectDb();
  // The text index is created by `npm run db:indexes` in real environments.
  await PublicationModel.createIndexes();
});

beforeEach(async () => {
  await PublicationModel.deleteMany({});
});

describe("publication repository", () => {
  it("lists published items newest first and filters by type and year", async () => {
    await PublicationModel.create([
      { ...base, slug: "a", title: "Alpha", summary: "s", publishedOn: new Date("2025-03-01") },
      {
        ...base,
        slug: "b",
        title: "Beta",
        type: "BRIEF",
        summary: "s",
        publishedOn: new Date("2026-02-01"),
      },
      {
        ...base,
        slug: "c",
        title: "Gamma",
        summary: "s",
        status: "DRAFT",
        publishedOn: new Date("2026-05-01"),
      },
    ]);

    const all = await listPublishedPublications({ page: 1 });
    expect(all.items.map((p) => p.slug)).toEqual(["b", "a"]);
    expect(all.total).toBe(2);
    expect((await listPublishedPublications({ page: 1, type: "BRIEF" })).items).toHaveLength(1);
    expect(
      (await listPublishedPublications({ page: 1, year: 2025 })).items.map((p) => p.slug),
    ).toEqual(["a"]);
    expect(await listPublicationYears()).toEqual([2026, 2025]);
    expect((await listLatestPublications(1)).map((p) => p.slug)).toEqual(["b"]);
  });

  it("searches title and summary, and treats operators in the search text as plain words", async () => {
    await PublicationModel.create([
      { ...base, slug: "a", title: "Rural literacy", summary: "A study of schools" },
      { ...base, slug: "b", title: "Budget brief", summary: "Funding overview" },
    ]);

    expect(
      (await listPublishedPublications({ page: 1, q: "literacy" })).items.map((p) => p.slug),
    ).toEqual(["a"]);
    expect((await listPublishedPublications({ page: 1, q: "$where" })).items).toEqual([]);
  });

  it("pages the results and returns null for a draft", async () => {
    await PublicationModel.create(
      Array.from({ length: 11 }, (_, index) => ({
        ...base,
        slug: `p${index}`,
        title: `P${index}`,
        summary: "s",
        publishedOn: new Date(Date.UTC(2026, 0, index + 1)),
      })),
    );
    await PublicationModel.create({
      ...base,
      slug: "draft",
      title: "D",
      summary: "s",
      status: "DRAFT",
    });

    const second = await listPublishedPublications({ page: 2 });
    expect(second.items).toHaveLength(2);
    expect(second.total).toBe(11);
    expect(await findPublishedPublicationBySlug("draft")).toBeNull();
  });
});
