import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, jobPostingJsonLd, newsJsonLd } from "@/lib/structured-data";
import type { NewsDetail } from "@/server/repositories/news.repository";
import type { VacancyDetail } from "@/server/repositories/vacancy.repository";

const vacancy: VacancyDetail = {
  id: "1",
  slug: "teacher",
  title: "Teacher",
  departmentName: "HR",
  departmentSlug: "hr",
  city: "Vehari",
  employmentType: "CONTRACT",
  deadline: new Date("2026-12-31T00:00:00Z"),
  description: "Teach.",
  requirements: "",
  publishedAt: null,
};

const post: NewsDetail = {
  id: "1",
  slug: "open-day",
  title: "Open day",
  type: "EVENT",
  excerpt: "Come along.",
  body: "",
  publishedAt: null,
  eventDate: new Date("2026-12-01T09:00:00Z"),
  venue: "Hall",
  authorName: "Staff",
  seoTitle: "",
  seoDescription: "",
};

describe("structured data", () => {
  it("maps a vacancy to a JobPosting with schema.org's employment type", () => {
    const data = jobPostingJsonLd(vacancy);
    expect(data["@type"]).toBe("JobPosting");
    expect(data.employmentType).toBe("CONTRACTOR");
    expect(data.validThrough).toBe("2026-12-31T00:00:00.000Z");
  });

  it("describes an event as an Event and an article as a NewsArticle", () => {
    expect(newsJsonLd(post)["@type"]).toBe("Event");
    expect(newsJsonLd({ ...post, type: "NEWS" })["@type"]).toBe("NewsArticle");
  });

  it("numbers breadcrumb items from one and makes their links absolute", () => {
    const data = breadcrumbJsonLd([{ name: "News", path: "/news" }]);
    expect(data.itemListElement[0]).toMatchObject({
      position: 1,
      item: "http://localhost:3000/news",
    });
  });
});
