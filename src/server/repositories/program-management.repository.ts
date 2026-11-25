import "server-only";
import mongoose, { type PipelineStage } from "mongoose";

import type { CONTENT_STATUSES, PROGRAM_CATEGORIES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import type { StoredImage } from "@/server/services/image.service";

type ProgramStatus = (typeof CONTENT_STATUSES)[number];
type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];

export interface StaffProgramListItem {
  id: string;
  slug: string;
  title: string;
  category: ProgramCategory;
  status: ProgramStatus;
  acceptsApplications: boolean;
  institutionCount: number;
  applicationCount: number;
  updatedAt: string;
}

export interface StaffProgramListOptions {
  q?: string | undefined;
  status?: ProgramStatus | undefined;
  category?: ProgramCategory | undefined;
  sort: { field: "title" | "updatedAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

interface ProgramRow {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  category: ProgramCategory;
  status: ProgramStatus;
  acceptsApplications: boolean;
  institutionIds: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

function toListItem(row: ProgramRow, applicationCount: number): StaffProgramListItem {
  return {
    id: row._id.toString(),
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    acceptsApplications: row.acceptsApplications,
    institutionCount: row.institutionIds.length,
    applicationCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Built only from validated values (enums and escaped text), never raw input.
function toMatch(options: StaffProgramListOptions): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  if (options.status) {
    match.status = options.status;
  }
  if (options.category) {
    match.category = options.category;
  }
  if (options.q) {
    match.title = new RegExp(escapeRegExp(options.q), "i");
  }
  return match;
}

/** Every program, drafts and archived ones included, with how many applications chose each. */
export async function listProgramsForStaff(
  options: StaffProgramListOptions,
): Promise<{ items: StaffProgramListItem[]; total: number }> {
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
        from: ApplicationModel.collection.name,
        localField: "_id",
        foreignField: "programId",
        as: "applications",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $project: {
        slug: 1,
        title: 1,
        category: 1,
        status: 1,
        acceptsApplications: 1,
        institutionIds: 1,
        updatedAt: 1,
        applicationCount: { $size: "$applications" },
      },
    },
  ];
  const [rows, total] = await Promise.all([
    ProgramModel.aggregate<ProgramRow & { applicationCount: number }>(pipeline),
    ProgramModel.countDocuments(match),
  ]);
  return { total, items: rows.map((row) => toListItem(row, row.applicationCount)) };
}

export interface StaffProgramDetail extends StaffProgramListItem {
  summary: string;
  description: string;
  duration: string;
  eligibility: string;
  institutionIds: string[];
  image: StoredImage | null;
  createdAt: string;
}

export async function findProgramForStaff(id: string): Promise<StaffProgramDetail | null> {
  await connectDb();
  const program = await ProgramModel.findById(id).lean();
  if (!program) {
    return null;
  }
  const applicationCount = await ApplicationModel.countDocuments({ programId: program._id });
  return {
    ...toListItem(program, applicationCount),
    summary: program.summary,
    description: program.description,
    duration: program.duration,
    eligibility: program.eligibility,
    institutionIds: program.institutionIds.map((institutionId) => institutionId.toString()),
    image: program.image
      ? {
          publicId: program.image.publicId,
          width: program.image.width,
          height: program.image.height,
          alt: program.image.alt,
        }
      : null,
    createdAt: program.createdAt.toISOString(),
  };
}

export interface ProgramFields {
  title: string;
  category: ProgramCategory;
  summary: string;
  description: string;
  duration: string;
  eligibility: string;
  institutionIds: string[];
  acceptsApplications: boolean;
  status: ProgramStatus;
  image: StoredImage | null;
}

function toUpdate(fields: ProgramFields) {
  const { image, institutionIds, ...rest } = fields;
  const set = {
    ...rest,
    institutionIds: institutionIds.map((id) => new mongoose.Types.ObjectId(id)),
  };
  return image ? { $set: { ...set, image } } : { $set: set, $unset: { image: 1 } };
}

/** Saves a new program and returns its ID. */
export async function createProgram(slug: string, fields: ProgramFields): Promise<string> {
  await connectDb();
  const { image, institutionIds, ...rest } = fields;
  const [created] = await ProgramModel.insertMany([
    {
      ...rest,
      slug,
      institutionIds: institutionIds.map((id) => new mongoose.Types.ObjectId(id)),
      ...(image ? { image } : {}),
    },
  ]);
  if (!created) {
    throw new Error("The program was not created.");
  }
  return created._id.toString();
}

/** Saves the fields while the program still has the status the caller saw. Returns false otherwise. */
export async function updateProgram(
  id: string,
  expectedStatus: ProgramStatus,
  fields: ProgramFields,
): Promise<boolean> {
  await connectDb();
  const result = await ProgramModel.updateOne(
    { _id: id, status: expectedStatus },
    toUpdate(fields),
  );
  return result.matchedCount === 1;
}

/** Deletes the program while it still has the status the caller saw. */
export async function deleteProgram(id: string, expectedStatus: ProgramStatus): Promise<boolean> {
  await connectDb();
  const result = await ProgramModel.deleteOne({ _id: id, status: expectedStatus });
  return result.deletedCount === 1;
}

/** Every institution as a choice for the program form, by name. */
export async function listInstitutionChoices(): Promise<
  { id: string; name: string; city: string }[]
> {
  await connectDb();
  const institutions = await InstitutionModel.find({}, { name: 1, city: 1 })
    .sort({ name: 1 })
    .lean();
  return institutions.map((institution) => ({
    id: institution._id.toString(),
    name: institution.name,
    city: institution.city,
  }));
}

/** How many of these IDs belong to an existing institution. */
export async function countExistingInstitutions(ids: readonly string[]): Promise<number> {
  await connectDb();
  return InstitutionModel.countDocuments({ _id: mongoose.trusted({ $in: ids }) });
}
