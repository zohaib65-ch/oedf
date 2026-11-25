import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import type { DEPARTMENT_CODES } from "@/lib/constants/enums";
import { issueDirectiveSchema } from "@/lib/validations/directive";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { DirectiveModel } from "@/server/db/models/directive.model";
import { sendEmail } from "@/server/email/send-email";
import { ensureDepartments } from "@/server/repositories/department.repository";
import {
  acknowledgeAssignment,
  addDirectiveNote,
  getDirective,
  getDirectives,
  issueDirective,
  requestClarification,
  resolveClarification,
  updateAssignment,
} from "@/server/services/directive.service";

vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

type Code = (typeof DEPARTMENT_CODES)[number];

const officeIds = new Map<Code, string>();

function person(role: StaffContext["role"], code: Code | null): StaffContext {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: `${role} ${code ?? "none"}`,
    email: `${role.toLowerCase()}@example.org`,
    role,
    departmentId: code ? (officeIds.get(code) ?? null) : null,
    departmentCode: code,
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

/** Saves the person as an active account, so they can be emailed or chosen as an owner. */
async function saveAccount(staff: StaffContext): Promise<void> {
  await mongoose.connection.collection("user").insertOne({
    _id: new mongoose.Types.ObjectId(staff.id),
    name: staff.name,
    email: `${staff.id}@example.org`,
    role: staff.role,
    departmentId: staff.departmentId,
    createdAt: new Date(),
  });
}

const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000 + 5 * 3_600_000).toISOString().slice(0, 10);

function issueInput(codes: Code[], dueDate = inDays(7)) {
  return issueDirectiveSchema.parse({
    title: "Report enrolment figures",
    body: "Send the term's enrolment figures.",
    departmentIds: codes.map((code) => officeIds.get(code)),
    dueDate,
    priority: "HIGH",
  });
}

let researchDirector: StaffContext;
let hrDirector: StaffContext;
let hrStaff: StaffContext;
let admissionsDirector: StaffContext;
let ceo: StaffContext;

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    DirectiveModel.deleteMany({}),
    mongoose.connection.collection("user").deleteMany({}),
    mongoose.connection.collection("counters").deleteMany({}),
  ]);
  await ensureDepartments(DEPARTMENTS);
  const departments = await DepartmentModel.find({}, { code: 1 }).lean();
  for (const department of departments) {
    officeIds.set(department.code, department._id.toString());
  }
  researchDirector = person("DIRECTOR", "RESEARCH_POLICY");
  hrDirector = person("DIRECTOR", "HR_TEACHER_MANAGEMENT");
  hrStaff = person("STAFF", "HR_TEACHER_MANAGEMENT");
  admissionsDirector = person("DIRECTOR", "ADMISSIONS_SCHOLARSHIPS");
  ceo = person("CEO_OFFICE", "CEO_OFFICE");
  await Promise.all([hrDirector, hrStaff, admissionsDirector, ceo].map(saveAccount));
  vi.resetAllMocks();
  vi.mocked(sendEmail).mockResolvedValue(true);
});

describe("directives", () => {
  it("lets only Research & Policy issue, numbers the directive and emails each office's Director", async () => {
    await expect(
      issueDirective(hrDirector, issueInput(["ADMISSIONS_SCHOLARSHIPS"])),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const directive = await issueDirective(
      researchDirector,
      issueInput(["HR_TEACHER_MANAGEMENT", "ADMISSIONS_SCHOLARSHIPS"]),
    );
    expect(directive.referenceNumber).toMatch(/^OEDF-DIR-\d{4}-001$/);
    expect(directive.assignments.map((item) => item.status)).toEqual([
      "PENDING_ACKNOWLEDGEMENT",
      "PENDING_ACKNOWLEDGEMENT",
    ]);
    const recipients = vi.mocked(sendEmail).mock.calls.map(([message]) => message.to);
    expect(recipients.sort()).toEqual(
      [`${hrDirector.id}@example.org`, `${admissionsDirector.id}@example.org`].sort(),
    );

    const second = await issueDirective(researchDirector, issueInput(["HR_TEACHER_MANAGEMENT"]));
    expect(second.referenceNumber).toMatch(/-002$/);
  });

  it("refuses a due date in the past", async () => {
    await expect(
      issueDirective(researchDirector, issueInput(["HR_TEACHER_MANAGEMENT"], inDays(-1))),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("shows an office only the directives addressed to it", async () => {
    const directive = await issueDirective(researchDirector, issueInput(["HR_TEACHER_MANAGEMENT"]));
    const query = {
      page: 1,
      pageSize: 20,
      sort: "dueDate" as const,
      q: undefined,
      status: undefined,
      priority: undefined,
      show: undefined,
    };
    expect((await getDirectives(hrStaff, query)).total).toBe(1);
    expect((await getDirectives(admissionsDirector, query)).total).toBe(0);
    expect((await getDirectives(ceo, query)).total).toBe(1);
    await expect(getDirective(admissionsDirector, directive.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("runs an office's part from acknowledgement to completion", async () => {
    const directive = await issueDirective(
      researchDirector,
      issueInput(["HR_TEACHER_MANAGEMENT", "ADMISSIONS_SCHOLARSHIPS"]),
    );
    const hrPart = directive.assignments.find(
      (item) => item.departmentId === hrDirector.departmentId,
    );
    if (!hrPart) {
      throw new Error("No HR part");
    }

    // Another office's Director and Staff cannot acknowledge.
    await expect(
      acknowledgeAssignment(admissionsDirector, directive.id, hrPart.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(acknowledgeAssignment(hrStaff, directive.id, hrPart.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await acknowledgeAssignment(hrDirector, directive.id, hrPart.id);
    await expect(acknowledgeAssignment(hrDirector, directive.id, hrPart.id)).rejects.toMatchObject({
      code: "CONFLICT",
    });

    await expect(
      updateAssignment(hrDirector, directive.id, hrPart.id, {
        ownerId: admissionsDirector.id,
        note: "",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const owned = await updateAssignment(hrDirector, directive.id, hrPart.id, {
      ownerId: hrStaff.id,
      note: "",
    });
    expect(owned.assignments.find((item) => item.id === hrPart.id)?.ownerName).toBe(hrStaff.name);

    await expect(
      updateAssignment(hrStaff, directive.id, hrPart.id, { status: "COMPLETED", note: "" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await updateAssignment(hrStaff, directive.id, hrPart.id, { status: "IN_PROGRESS", note: "" });
    await addDirectiveNote(hrStaff, directive.id, hrPart.id, {
      body: "Half the schools have sent figures.",
    });
    const done = await updateAssignment(hrStaff, directive.id, hrPart.id, {
      status: "COMPLETED",
      note: "All figures sent.",
    });
    const finished = done.assignments.find((item) => item.id === hrPart.id);
    expect(finished?.status).toBe("COMPLETED");
    expect(finished?.completedAt).not.toBeNull();
    expect(finished?.history.map((entry) => entry.to)).toEqual([
      "PENDING_ACKNOWLEDGEMENT",
      "ACKNOWLEDGED",
      "IN_PROGRESS",
      "COMPLETED",
    ]);
    // Owner note and progress update.
    expect(finished?.updates).toHaveLength(2);
    await expect(
      addDirectiveNote(hrStaff, directive.id, hrPart.id, {
        body: "Late note",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("escalates a clarification to the CEO Office, who reopens or closes the part", async () => {
    const directive = await issueDirective(
      researchDirector,
      issueInput(["HR_TEACHER_MANAGEMENT", "ADMISSIONS_SCHOLARSHIPS"]),
    );
    const [first, second] = directive.assignments;
    if (!first || !second) {
      throw new Error("Two parts expected");
    }
    const directorOf = (departmentId: string) =>
      departmentId === hrDirector.departmentId ? hrDirector : admissionsDirector;

    await acknowledgeAssignment(directorOf(first.departmentId), directive.id, first.id);
    await updateAssignment(directorOf(first.departmentId), directive.id, first.id, {
      status: "IN_PROGRESS",
      note: "",
    });
    vi.mocked(sendEmail).mockClear();
    await requestClarification(directorOf(first.departmentId), directive.id, first.id, {
      reason: "DONOR_RESTRICTION",
      text: "The donor funds may not be used for this.",
    });
    expect(vi.mocked(sendEmail).mock.calls.map(([message]) => message.to)).toEqual([
      `${ceo.id}@example.org`,
    ]);
    await expect(
      resolveClarification(researchDirector, directive.id, first.id, {
        decision: "CLOSE",
        note: "No",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const reopened = await resolveClarification(ceo, directive.id, first.id, {
      decision: "REOPEN",
      note: "Use the general fund instead.",
    });
    const back = reopened.assignments.find((item) => item.id === first.id);
    expect(back?.status).toBe("IN_PROGRESS");
    expect(back?.clarification?.resolution?.decision).toBe("REOPEN");

    await requestClarification(directorOf(second.departmentId), directive.id, second.id, {
      reason: "OPERATIONAL_IMPOSSIBILITY",
      text: "We have no staff for this.",
    });
    const closed = await resolveClarification(ceo, directive.id, second.id, {
      decision: "CLOSE",
      note: "Released.",
    });
    expect(closed.assignments.find((item) => item.id === second.id)?.status).toBe("CLOSED");
  });

  it("marks a directive overdue only after its due day, until every part is finished", async () => {
    const directive = await issueDirective(
      researchDirector,
      issueInput(["HR_TEACHER_MANAGEMENT"], inDays(0)),
    );
    expect(directive.isOverdue).toBe(false);
    await DirectiveModel.updateOne(
      { _id: directive.id },
      { dueDate: new Date(`${inDays(-1)}T00:00:00Z`) },
    );
    const late = await getDirective(ceo, directive.id);
    expect(late.isOverdue).toBe(true);
    const overdue = await getDirectives(hrStaff, {
      page: 1,
      pageSize: 20,
      sort: "dueDate",
      q: undefined,
      status: undefined,
      priority: undefined,
      show: "OVERDUE",
    });
    expect(overdue.total).toBe(1);
  });
});
