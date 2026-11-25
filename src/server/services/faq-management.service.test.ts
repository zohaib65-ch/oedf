import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { FaqModel } from "@/server/db/models/faq.model";
import { listPublishedFaqs } from "@/server/repositories/faq.repository";
import {
  createFaq,
  deleteFaq,
  getFaqsForStaff,
  reorderFaqs,
  updateFaq,
} from "@/server/services/faq-management.service";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

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
const staff = person("STAFF", "ADMISSIONS_SCHOLARSHIPS");

const faq = (question: string, category = "Admissions", isPublished = true) => ({
  question,
  answer: "An answer.",
  category,
  isPublished,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([AuditLogModel.deleteMany({}), FaqModel.deleteMany({})]);
  vi.resetAllMocks();
});

describe("FAQ management", () => {
  it("is the CEO Office's only", async () => {
    await expect(createFaq(staff, faq("Q"))).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("adds questions to the end of their topic and saves a new order", async () => {
    const first = await createFaq(ceo, faq("First"));
    const second = await createFaq(ceo, faq("Second"));
    const third = await createFaq(ceo, faq("Third"));
    await createFaq(ceo, faq("Other topic", "Scholarships"));

    await reorderFaqs(ceo, { category: "Admissions", ids: [third.id, first.id, second.id] });
    const admissions = (await listPublishedFaqs()).filter((item) => item.category === "Admissions");
    expect(admissions.map((item) => item.question)).toEqual(["Third", "First", "Second"]);
    expect(revalidateTag).toHaveBeenCalledWith("faqs", { expire: 0 });

    // A list that leaves a question out is refused, so nothing is lost.
    await expect(
      reorderFaqs(ceo, { category: "Admissions", ids: [first.id, second.id] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("moves an edited question to the end of its new topic, and hides unpublished ones", async () => {
    const moved = await createFaq(ceo, faq("Moved"));
    await createFaq(ceo, faq("Already there", "Scholarships"));
    await updateFaq(ceo, moved.id, faq("Moved", "Scholarships", false));

    const all = await getFaqsForStaff();
    expect(
      all.filter((item) => item.category === "Scholarships").map((item) => item.question),
    ).toEqual(["Already there", "Moved"]);
    expect((await listPublishedFaqs()).map((item) => item.question)).toEqual(["Already there"]);
  });

  it("deletes with an audit entry", async () => {
    const created = await createFaq(ceo, faq("Gone"));
    await deleteFaq(ceo, created.id);
    expect(await FaqModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments({ action: "faq.deleted" })).toBe(1);
  });
});
