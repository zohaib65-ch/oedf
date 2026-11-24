import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import { contactMessageSchema } from "@/lib/validations/contact";
import { connectDb } from "@/server/db/connection";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { sendEmail } from "@/server/email/send-email";
import { ensureDepartments } from "@/server/repositories/department.repository";
import { submitContactMessage } from "@/server/services/contact-message.service";

vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

const message = (subject: string) =>
  contactMessageSchema.parse({
    name: "Sara",
    email: "Sara@Example.org",
    subject,
    message: "Hello there",
  });

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    ContactMessageModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    SiteSettingsModel.deleteMany({}),
  ]);
  await ensureDepartments(DEPARTMENTS);
  vi.resetAllMocks();
  vi.mocked(sendEmail).mockResolvedValue(true);
});

describe("submitContactMessage", () => {
  it("routes by subject to the office, saves it and emails the office address with reply-to the sender", async () => {
    await DepartmentModel.updateOne(
      { code: "ADMISSIONS_SCHOLARSHIPS" },
      { notificationEmail: "admissions@example.org" },
    );

    await submitContactMessage(message("SCHOLARSHIPS"));

    const saved = await ContactMessageModel.findOne({}).lean();
    const department = await DepartmentModel.findOne({ code: "ADMISSIONS_SCHOLARSHIPS" }).lean();
    expect(saved?.departmentId.toString()).toBe(department?._id.toString());
    expect(saved?.status).toBe("NEW");
    expect(saved?.email).toBe("sara@example.org");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admissions@example.org", replyTo: "sara@example.org" }),
    );
  });

  it("falls back to the general email in Settings when the office has no address", async () => {
    await SiteSettingsModel.create({ contact: { email: "info@example.org" } });

    await submitContactMessage(message("CAREERS"));

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "info@example.org" }));
  });

  it("only saves the message when there is no address anywhere", async () => {
    await SiteSettingsModel.create({});

    await submitContactMessage(message("GENERAL"));

    expect(await ContactMessageModel.countDocuments()).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
