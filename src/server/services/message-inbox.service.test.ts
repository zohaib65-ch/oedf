import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import {
  changeMessageStatus,
  getMessage,
  getMessages,
} from "@/server/services/message-inbox.service";

const admissions = new mongoose.Types.ObjectId().toString();
const hr = new mongoose.Types.ObjectId().toString();

function person(role: StaffContext["role"], departmentId: string | null): StaffContext {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: `${role} person`,
    email: "person@example.org",
    role,
    departmentId,
    departmentCode: null,
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

const query = {
  page: 1,
  pageSize: 20,
  sort: "-createdAt" as const,
  q: undefined,
  status: undefined,
  subject: undefined,
};

async function addMessage(name: string, departmentId: string) {
  const [message] = await ContactMessageModel.insertMany([
    {
      name,
      email: `${name.toLowerCase()}@example.org`,
      subject: departmentId === hr ? "CAREERS" : "ADMISSIONS",
      message: "Hello.",
      departmentId,
    },
  ]);
  return message?._id.toString() ?? "";
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([AuditLogModel.deleteMany({}), ContactMessageModel.deleteMany({})]);
});

describe("message inbox", () => {
  it("shows an office only its own messages, and the CEO Office every message", async () => {
    const own = await addMessage("Amna", admissions);
    const other = await addMessage("Bilal", hr);

    const staff = person("STAFF", admissions);
    expect((await getMessages(staff, query)).items.map((item) => item.name)).toEqual(["Amna"]);
    expect((await getMessages(person("CEO_OFFICE", null), query)).total).toBe(2);
    expect((await getMessages(person("STAFF", null), query)).total).toBe(0);
    expect((await getMessage(staff, own)).message).toBe("Hello.");
    await expect(getMessage(staff, other)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("changes the status, records it, and filters by it", async () => {
    const id = await addMessage("Amna", admissions);
    const director = person("DIRECTOR", admissions);
    const replied = await changeMessageStatus(director, id, { status: "REPLIED" });
    expect(replied.status).toBe("REPLIED");
    expect(await AuditLogModel.countDocuments({ action: "message.status_changed" })).toBe(1);
    expect((await getMessages(director, { ...query, status: "NEW" })).total).toBe(0);
    expect((await getMessages(director, { ...query, q: "amna@" })).total).toBe(1);
  });
});
