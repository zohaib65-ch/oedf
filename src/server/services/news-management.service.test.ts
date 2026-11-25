import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newsFormSchema, type NewsFormInput } from "@/lib/validations/news";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import {
  createNewsPost,
  deleteNewsPost,
  getNewsForStaff,
  updateNewsPost,
} from "@/server/services/news-management.service";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  markUploadsConfirmed: vi.fn(),
  deletePublicImage: vi.fn(),
}));

function person(role: StaffContext["role"], code: StaffContext["departmentCode"]): StaffContext {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: `${role} person`,
    email: "person@example.org",
    role,
    departmentId: null,
    departmentCode: code,
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

const ceo = person("CEO_OFFICE", "CEO_OFFICE");
const director = person("DIRECTOR", "RESEARCH_POLICY");

function form(overrides: Record<string, unknown> = {}): NewsFormInput {
  return newsFormSchema.parse({
    title: "Open day",
    type: "NEWS",
    excerpt: "Come and see us.",
    body: "We open our doors.\n\n- Tours\n- Talks",
    eventDate: "",
    eventStartTime: "",
    venue: "",
    status: "DRAFT",
    publishedOn: "",
    seoTitle: "",
    seoDescription: "",
    imageAlt: "",
    ...overrides,
  });
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([AuditLogModel.deleteMany({}), NewsPostModel.deleteMany({})]);
  vi.resetAllMocks();
});

describe("news management", () => {
  it("is the CEO Office's: Directors cannot create posts", async () => {
    await expect(createNewsPost(director, form())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("needs a date for an event, and drops the date and venue from news", () => {
    expect(() => form({ type: "EVENT" })).toThrow();
    expect(form({ type: "EVENT", eventDate: "2026-12-01", venue: "Hall" }).eventDate).toBe(
      "2026-12-01",
    );
  });

  it("stamps the publish time once, keeps it on later edits, and refreshes the news pages", async () => {
    const draft = await createNewsPost(ceo, form());
    expect(draft.publishedAt).toBeNull();
    expect(draft.authorName).toBe(ceo.name);
    expect(draft.slug).toBe("open-day");

    const published = await updateNewsPost(ceo, draft.id, form({ status: "PUBLISHED" }));
    expect(published.publishedAt).not.toBeNull();
    expect(revalidateTag).toHaveBeenCalledWith("news", { expire: 0 });

    const edited = await updateNewsPost(
      ceo,
      draft.id,
      form({
        status: "PUBLISHED",
        title: "Open day 2026",
        publishedOn: published.publishedAt?.slice(0, 10),
      }),
    );
    expect(edited.publishedAt).toBe(published.publishedAt);

    const backdated = await updateNewsPost(
      ceo,
      draft.id,
      form({ status: "PUBLISHED", publishedOn: "2026-01-15" }),
    );
    expect(backdated.publishedAt).toBe("2026-01-15T00:00:00.000Z");
  });

  it("keeps an event's date and venue, and saves search engine text", async () => {
    const event = await createNewsPost(
      ceo,
      form({
        type: "EVENT",
        eventDate: "2026-12-01",
        eventStartTime: "10:30",
        venue: "Main hall",
        seoTitle: "Open day at OEDF",
      }),
    );
    expect(event).toMatchObject({
      eventDate: "2026-12-01",
      eventStartTime: "10:30",
      venue: "Main hall",
      seoTitle: "Open day at OEDF",
    });
    const news = await updateNewsPost(ceo, event.id, form({ venue: "Ignored" }));
    expect(news).toMatchObject({ eventDate: null, eventStartTime: "", venue: "" });
  });

  it("deletes after the audit-logged check, and lists every post with filters", async () => {
    const post = await createNewsPost(ceo, form({ status: "PUBLISHED" }));
    await createNewsPost(ceo, form({ title: "Event", type: "EVENT", eventDate: "2026-12-01" }));

    const events = await getNewsForStaff({
      page: 1,
      pageSize: 20,
      sort: "title",
      q: undefined,
      status: undefined,
      type: "EVENT",
    });
    expect(events.items.map((item) => item.title)).toEqual(["Event"]);

    await deleteNewsPost(ceo, post.id);
    expect(await NewsPostModel.countDocuments()).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: "news.deleted" })).toBe(1);
  });
});
