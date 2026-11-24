import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { FaqModel } from "@/server/db/models/faq.model";
import { listPublishedFaqs } from "@/server/repositories/faq.repository";

beforeEach(async () => {
  await connectDb();
  await FaqModel.deleteMany({});
});

describe("faq repository", () => {
  it("returns published questions ordered by category and position", async () => {
    await FaqModel.create([
      { question: "Q2", answer: "a", category: "Admissions", order: 2, isPublished: true },
      { question: "Q1", answer: "a", category: "Admissions", order: 1, isPublished: true },
      { question: "Hidden", answer: "a", category: "Admissions", order: 0, isPublished: false },
      { question: "Q3", answer: "a", category: "Scholarships", order: 1, isPublished: true },
    ]);

    const faqs = await listPublishedFaqs();
    expect(faqs.map((faq) => faq.question)).toEqual(["Q1", "Q2", "Q3"]);
  });
});
