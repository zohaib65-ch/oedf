import "server-only";
import mongoose, { type PipelineStage } from "mongoose";

import type { EMPLOYMENT_TYPES, VACANCY_STATUSES } from "@/lib/constants/enums";
import { effectiveVacancyStatus } from "@/lib/constants/vacancy-workflow";
import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import { toPakistanDay } from "@/server/lib/day-range";
import { escapeRegExp } from "@/server/lib/escape-regexp";

type VacancyStatus = (typeof VACANCY_STATUSES)[number];
type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface StaffVacancyListItem {
  id: string;
  slug: string;
  title: string;
  departmentName: string;
  city: string;
  employmentType: EmploymentType;
  /** The last moment to apply (ISO). */
  deadline: string;
  /** As stored. */
  status: VacancyStatus;
  /** What staff and visitors see: a published vacancy past its deadline is closed. */
  shownStatus: VacancyStatus;
  applicationCount: number;
  createdAt: string;
}

export interface StaffVacancyListOptions {
  q?: string | undefined;
  /** Draft, open (published, deadline ahead) or closed (closed, or published and past the deadline). */
  status?: VacancyStatus | undefined;
  departmentId?: string | undefined;
  type?: EmploymentType | undefined;
  sort: { field: "title" | "deadline" | "createdAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
  now: Date;
}

async function loadDepartmentNames(): Promise<Map<string, string>> {
  const departments = await DepartmentModel.find({}, { name: 1 }).lean();
  return new Map(departments.map((department) => [department._id.toString(), department.name]));
}

function statusCondition(status: VacancyStatus, now: Date): Record<string, unknown> {
  if (status === "PUBLISHED") {
    return { status: "PUBLISHED", deadline: mongoose.trusted({ $gte: now }) };
  }
  if (status === "CLOSED") {
    return {
      $or: [
        { status: "CLOSED" },
        { status: "PUBLISHED", deadline: mongoose.trusted({ $lt: now }) },
      ],
    };
  }
  return { status };
}

// Built only from validated values (enums, an ObjectId, a date and escaped text), never raw input.
// Operator objects are marked trusted so the global `sanitizeFilter` leaves them as they are.
function toMatch(options: StaffVacancyListOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];
  if (options.status) {
    conditions.push(statusCondition(options.status, options.now));
  }
  if (options.departmentId) {
    conditions.push({ departmentId: new mongoose.Types.ObjectId(options.departmentId) });
  }
  if (options.type) {
    conditions.push({ employmentType: options.type });
  }
  if (options.q) {
    const pattern = new RegExp(escapeRegExp(options.q), "i");
    conditions.push({ $or: [{ title: pattern }, { city: pattern }] });
  }
  return conditions.length > 0 ? { $and: conditions } : {};
}

interface VacancyRow {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  departmentId: mongoose.Types.ObjectId;
  city: string;
  employmentType: EmploymentType;
  deadline: Date;
  status: VacancyStatus;
  createdAt: Date;
}

function toListItem(
  row: VacancyRow,
  applicationCount: number,
  departmentNames: Map<string, string>,
  now: Date,
): StaffVacancyListItem {
  return {
    id: row._id.toString(),
    slug: row.slug,
    title: row.title,
    departmentName: departmentNames.get(row.departmentId.toString()) ?? "",
    city: row.city,
    employmentType: row.employmentType,
    deadline: row.deadline.toISOString(),
    status: row.status,
    shownStatus: effectiveVacancyStatus(row.status, row.deadline.toISOString(), now.getTime()),
    applicationCount,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Every vacancy, drafts included, with how many people applied to each. */
export async function listVacanciesForStaff(
  options: StaffVacancyListOptions,
): Promise<{ items: StaffVacancyListItem[]; total: number }> {
  await connectDb();
  const match = toMatch(options);
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { [options.sort.field]: direction, _id: -1 } },
    { $skip: (options.page - 1) * options.pageSize },
    { $limit: options.pageSize },
    {
      $lookup: {
        from: JobApplicationModel.collection.name,
        localField: "_id",
        foreignField: "vacancyId",
        as: "applications",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $project: {
        slug: 1,
        title: 1,
        departmentId: 1,
        city: 1,
        employmentType: 1,
        deadline: 1,
        status: 1,
        createdAt: 1,
        applicationCount: { $size: "$applications" },
      },
    },
  ];
  const [rows, total, departmentNames] = await Promise.all([
    VacancyModel.aggregate<VacancyRow & { applicationCount: number }>(pipeline),
    VacancyModel.countDocuments(match),
    loadDepartmentNames(),
  ]);
  return {
    total,
    items: rows.map((row) => toListItem(row, row.applicationCount, departmentNames, options.now)),
  };
}

export interface StaffVacancyDetail extends StaffVacancyListItem {
  departmentId: string;
  description: string;
  requirements: string;
  /** The deadline as the day staff picked (YYYY-MM-DD, Pakistan time). */
  deadlineDay: string;
  publishedAt: string | null;
  updatedAt: string;
}

export async function findVacancyForStaff(
  id: string,
  now: Date,
): Promise<StaffVacancyDetail | null> {
  await connectDb();
  const vacancy = await VacancyModel.findById(id).lean();
  if (!vacancy) {
    return null;
  }
  const [applicationCount, departmentNames] = await Promise.all([
    JobApplicationModel.countDocuments({ vacancyId: vacancy._id }),
    loadDepartmentNames(),
  ]);
  return {
    ...toListItem(vacancy, applicationCount, departmentNames, now),
    departmentId: vacancy.departmentId.toString(),
    description: vacancy.description,
    requirements: vacancy.requirements,
    deadlineDay: toPakistanDay(vacancy.deadline),
    publishedAt: vacancy.publishedAt ? vacancy.publishedAt.toISOString() : null,
    updatedAt: vacancy.updatedAt.toISOString(),
  };
}

export interface VacancyFields {
  title: string;
  departmentId: string;
  city: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string;
  deadline: Date;
}

/** Saves a new draft and returns its ID. */
export async function createVacancyDraft(slug: string, fields: VacancyFields): Promise<string> {
  await connectDb();
  const [created] = await VacancyModel.insertMany([{ ...fields, slug, status: "DRAFT" }]);
  if (!created) {
    throw new Error("The vacancy was not created.");
  }
  return created._id.toString();
}

/** Saves the fields while the vacancy still has the status the caller saw. Returns false otherwise. */
export async function updateVacancyFields(
  id: string,
  expectedStatus: VacancyStatus,
  fields: VacancyFields,
): Promise<boolean> {
  await connectDb();
  const result = await VacancyModel.updateOne(
    { _id: id, status: expectedStatus },
    { $set: fields },
  );
  return result.matchedCount === 1;
}

/**
 * Moves the vacancy from `from` to `to`. The first publication also records when it happened.
 * Returns false when the status changed in the meantime.
 */
export async function setVacancyStatus(
  id: string,
  change: { from: VacancyStatus; to: VacancyStatus; publishedAt?: Date | undefined },
): Promise<boolean> {
  await connectDb();
  const result = await VacancyModel.updateOne(
    { _id: id, status: change.from },
    {
      $set: {
        status: change.to,
        ...(change.publishedAt ? { publishedAt: change.publishedAt } : {}),
      },
    },
  );
  return result.modifiedCount === 1;
}

/** Deletes a draft. Returns false when it is no longer a draft (or does not exist). */
export async function deleteDraftVacancy(id: string): Promise<boolean> {
  await connectDb();
  const result = await VacancyModel.deleteOne({ _id: id, status: "DRAFT" });
  return result.deletedCount === 1;
}

/** Every vacancy as a choice for a filter, newest first. */
export async function listVacancyOptions(): Promise<{ id: string; title: string }[]> {
  await connectDb();
  const vacancies = await VacancyModel.find({}, { title: 1 }).sort({ createdAt: -1 }).lean();
  return vacancies.map((vacancy) => ({ id: vacancy._id.toString(), title: vacancy.title }));
}

/** True when an office with this ID exists. */
export async function departmentExists(id: string): Promise<boolean> {
  await connectDb();
  return (await DepartmentModel.exists({ _id: id })) !== null;
}
