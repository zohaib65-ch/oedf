import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import {
  findPublishedNewsBySlug,
  listLatestNews,
  listPublishedNews,
} from "@/server/repositories/news.repository";

const author = new mongoose.Types.ObjectId();

interface PostOverrides {
  type?: "NEWS" | "EVENT";
  status?: "DRAFT" | "PUBLISHED";
  publishedAt?: Date;
  body?: string;
}

function post(slug: string, overrides: PostOverrides = {}) {
  return {
    slug,
    title: slug,
    type: "NEWS" as const,
    excerpt: "e",
    body: "b",
    status: "PUBLISHED" as const,
    authorId: author,
    authorName: "Staff",
    publishedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

beforeEach(async () => {
  await connectDb();
  await NewsPostModel.deleteMany({});
});

describe("news repository", () => {
  it("lists published posts newest first, filtered by type, with a total for paging", async () => {
    await NewsPostModel.create([
      post("old", { publishedAt: new Date("2026-01-01") }),
      post("new", { publishedAt: new Date("2026-03-01") }),
      post("event", { type: "EVENT", publishedAt: new Date("2026-02-01") }),
      post("draft", { status: "DRAFT" }),
    ]);

    const all = await listPublishedNews({ page: 1 });
    expect(all.items.map((p) => p.slug)).toEqual(["new", "event", "old"]);
    expect(all.total).toBe(3);
    expect((await listPublishedNews({ page: 1, type: "EVENT" })).items).toHaveLength(1);
    expect((await listLatestNews(2)).map((p) => p.slug)).toEqual(["new", "event"]);
  });

  it("returns the body of a published post and null for a draft", async () => {
    await NewsPostModel.create([
      post("live", { body: "Full text" }),
      post("draft", { status: "DRAFT" }),
    ]);

    expect((await findPublishedNewsBySlug("live"))?.body).toBe("Full text");
    expect(await findPublishedNewsBySlug("draft")).toBeNull();
  });
});
