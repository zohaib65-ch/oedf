import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import { getDashboardSummary } from "@/server/services/dashboard.service";

const officeA = new mongoose.Types.ObjectId().toString();
const officeB = new mongoose.Types.ObjectId().toString();

const staff = (
  role: StaffContext["role"],
  departmentCode: StaffContext["departmentCode"],
  departmentId: string | null,
): StaffContext => ({
  id: new mongoose.Types.ObjectId().toString(),
  name: "Person",
  email: "p@example.org",
  role,
  departmentId,
  departmentCode,
  ipAddress: "",
  userAgent: "",
});

async function addMessage(departmentId: string) {
  await ContactMessageModel.create({
    name: "A",
    email: "a@example.org",
    subject: "GENERAL",
    message: "m",
    departmentId,
  });
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    ApplicationModel.deleteMany({}),
    ContactMessageModel.deleteMany({}),
    VacancyModel.deleteMany({}),
  ]);
});

const metricValue = (summary: Awaited<ReturnType<typeof getDashboardSummary>>, key: string) =>
  summary.metrics.find((metric) => metric.key === key)?.value;

describe("getDashboardSummary", () => {
  it("counts unread messages for the whole foundation for the CEO Office, and for one office for staff", async () => {
    await addMessage(officeA);
    await addMessage(officeA);
    await addMessage(officeB);

    const ceo = await getDashboardSummary(staff("CEO_OFFICE", "CEO_OFFICE", null));
    const own = await getDashboardSummary(staff("STAFF", "RESEARCH_POLICY", officeA));

    expect(ceo.scope).toBe("ALL_OFFICES");
    expect(metricValue(ceo, "unreadMessages")).toBe(3);
    expect(own.scope).toBe("OWN_OFFICE");
    expect(metricValue(own, "unreadMessages")).toBe(2);
  });

  it("shows application figures and the monthly chart only to those who may read applications", async () => {
    const research = await getDashboardSummary(staff("STAFF", "RESEARCH_POLICY", officeA));
    expect(metricValue(research, "newApplications")).toBeUndefined();
    expect(research.applicationsByMonth).toBeNull();

    const admissions = await getDashboardSummary(
      staff("DIRECTOR", "ADMISSIONS_SCHOLARSHIPS", officeA),
    );
    expect(metricValue(admissions, "newApplications")).toBeDefined();
    expect(admissions.applicationsByMonth).toHaveLength(12);
  });

  it("shows no office-specific figures to a member of no office", async () => {
    await addMessage(officeA);
    const nobody = await getDashboardSummary(staff("STAFF", null, null));
    expect(metricValue(nobody, "unreadMessages")).toBeUndefined();
  });
});
