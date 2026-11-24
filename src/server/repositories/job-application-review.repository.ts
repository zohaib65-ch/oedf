import "server-only";
import mongoose, { type PipelineStage } from "mongoose";

import type { JOB_APPLICATION_STATUSES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import { toPakistanDateTime } from "@/server/lib/day-range";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import { buildTimeline, type TimelineEntry } from "@/server/lib/timeline";

type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

const CNIC_DIGITS = 13;
const CNIC_LAST_DIGITS = 4;

const SORT_PATHS = {
  referenceNumber: "referenceNumber",
  name: "candidate.fullName",
  status: "status",
  createdAt: "createdAt",
  interviewAt: "interviewAt",
} as const;

export interface JobApplicationListOptions {
  q?: string | undefined;
  vacancyId?: string | undefined;
  status?: JobApplicationStatus | undefined;
  /** Archived applications only, or (by default) the ones still in use. */
  isArchived: boolean;
  sort: { field: keyof typeof SORT_PATHS; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

/** A row of the staff list. Only the last four CNIC digits ever leave the database. */
export interface JobApplicationListItem {
  id: string;
  referenceNumber: string;
  status: JobApplicationStatus;
  candidateName: string;
  city: string;
  cnicLast4: string;
  vacancyId: string;
  vacancyTitle: string | null;
  interviewAt: string | null;
  createdAt: string;
}

/** A CNIC (13 digits, with or without dashes) is matched exactly; anything else matches name or reference. */
function searchCondition(q: string): Record<string, unknown> {
  const digits = q.replaceAll("-", "");
  if (/^\d+$/.test(digits) && digits.length === CNIC_DIGITS) {
    return { "candidate.cnic": digits };
  }
  const pattern = new RegExp(escapeRegExp(q), "i");
  return { $or: [{ "candidate.fullName": pattern }, { referenceNumber: pattern }] };
}

// Built only from validated values (an enum, an ObjectId, a boolean and escaped text), never raw input.
// Operator objects are marked trusted so the global `sanitizeFilter` leaves them as they are.
function toMatch(options: JobApplicationListOptions): Record<string, unknown> {
  const match: Record<string, unknown> = {
    archivedAt: mongoose.trusted({ $exists: options.isArchived }),
  };
  if (options.vacancyId) {
    match.vacancyId = new mongoose.Types.ObjectId(options.vacancyId);
  }
  if (options.status) {
    match.status = options.status;
  }
  return options.q ? { $and: [match, searchCondition(options.q)] } : match;
}

export async function listJobApplicationsForReview(
  options: JobApplicationListOptions,
): Promise<{ items: JobApplicationListItem[]; total: number }> {
  await connectDb();
  const match = toMatch(options);
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { [SORT_PATHS[options.sort.field]]: direction, _id: -1 } },
    { $skip: (options.page - 1) * options.pageSize },
    { $limit: options.pageSize },
    {
      $lookup: {
        from: VacancyModel.collection.name,
        localField: "vacancyId",
        foreignField: "_id",
        as: "vacancy",
        pipeline: [{ $project: { title: 1 } }],
      },
    },
    {
      $project: {
        referenceNumber: 1,
        status: 1,
        vacancyId: 1,
        interviewAt: 1,
        createdAt: 1,
        candidateName: "$candidate.fullName",
        city: "$candidate.city",
        cnicLast4: {
          $substrCP: ["$candidate.cnic", CNIC_DIGITS - CNIC_LAST_DIGITS, CNIC_LAST_DIGITS],
        },
        vacancyTitle: { $first: "$vacancy.title" },
      },
    },
  ];
  const [rows, total] = await Promise.all([
    JobApplicationModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      referenceNumber: string;
      status: JobApplicationStatus;
      vacancyId: mongoose.Types.ObjectId;
      interviewAt?: Date;
      createdAt: Date;
      candidateName: string;
      city: string;
      cnicLast4: string;
      vacancyTitle?: string;
    }>(pipeline),
    JobApplicationModel.countDocuments(match),
  ]);
  return {
    total,
    items: rows.map((row) => ({
      id: row._id.toString(),
      referenceNumber: row.referenceNumber,
      status: row.status,
      candidateName: row.candidateName,
      city: row.city,
      cnicLast4: row.cnicLast4,
      vacancyId: row.vacancyId.toString(),
      vacancyTitle: row.vacancyTitle ?? null,
      interviewAt: row.interviewAt ? row.interviewAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

/** Everything staff see on a job application's page. Only for people allowed to read them. */
export interface JobApplicationDetail {
  id: string;
  referenceNumber: string;
  status: JobApplicationStatus;
  vacancy: { id: string; title: string } | null;
  candidate: {
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    city: string;
    highestQualification: string;
    yearsOfExperience: number;
    coverLetter: string;
  };
  cv: { fileId: string; originalName: string; format: string; bytes: number };
  interviewAt: string | null;
  /** The interview time as a datetime-local value in Pakistan time, or empty. */
  interviewAtLocal: string;
  archivedAt: string | null;
  timeline: TimelineEntry<JobApplicationStatus>[];
  createdAt: string;
}

export async function findJobApplicationDetail(id: string): Promise<JobApplicationDetail | null> {
  await connectDb();
  const application = await JobApplicationModel.findById(id).lean();
  if (!application) {
    return null;
  }
  const [vacancy, cv] = await Promise.all([
    VacancyModel.findById(application.vacancyId, { title: 1 }).lean(),
    FileAssetModel.findById(application.cvFileId, { originalName: 1, format: 1, bytes: 1 }).lean(),
  ]);
  return {
    id: application._id.toString(),
    referenceNumber: application.referenceNumber,
    status: application.status,
    vacancy: vacancy ? { id: vacancy._id.toString(), title: vacancy.title } : null,
    candidate: application.candidate,
    cv: {
      fileId: application.cvFileId.toString(),
      originalName: cv?.originalName ?? "Unknown file",
      format: cv?.format ?? "",
      bytes: cv?.bytes ?? 0,
    },
    interviewAt: application.interviewAt ? application.interviewAt.toISOString() : null,
    interviewAtLocal: application.interviewAt ? toPakistanDateTime(application.interviewAt) : "",
    archivedAt: application.archivedAt ? application.archivedAt.toISOString() : null,
    timeline: buildTimeline<JobApplicationStatus>(application.statusHistory, application.notes),
    createdAt: application.createdAt.toISOString(),
  };
}

interface Actor {
  id: string;
  name: string;
}

const NOT_ARCHIVED = { archivedAt: mongoose.trusted({ $exists: false }) };

/**
 * Moves the application from `from` to `to` and records who, when and why. The write matches the
 * expected status and skips archived applications, so it returns false when either changed.
 */
export async function changeJobApplicationStatus(
  id: string,
  change: { from: JobApplicationStatus; to: JobApplicationStatus; reason: string; actor: Actor },
): Promise<boolean> {
  await connectDb();
  const result = await JobApplicationModel.updateOne(
    { _id: id, status: change.from, ...NOT_ARCHIVED },
    {
      $set: { status: change.to },
      $push: {
        statusHistory: {
          from: change.from,
          to: change.to,
          reason: change.reason,
          actorId: new mongoose.Types.ObjectId(change.actor.id),
          actorName: change.actor.name,
        },
      },
    },
  );
  return result.modifiedCount === 1;
}

/**
 * Sets (or with null, clears) the interview time while the application is in one of the given
 * statuses and not archived. Returns false otherwise.
 */
export async function setInterviewTime(
  id: string,
  interviewAt: Date | null,
  allowedStatuses: readonly JobApplicationStatus[],
): Promise<boolean> {
  await connectDb();
  const result = await JobApplicationModel.updateOne(
    { _id: id, status: mongoose.trusted({ $in: allowedStatuses }), ...NOT_ARCHIVED },
    interviewAt ? { $set: { interviewAt } } : { $unset: { interviewAt: 1 } },
  );
  return result.matchedCount === 1;
}

/** Archives the application, or restores it. Nothing is ever deleted. */
export async function setJobApplicationArchived(id: string, isArchived: boolean): Promise<boolean> {
  await connectDb();
  const result = await JobApplicationModel.updateOne(
    { _id: id },
    isArchived ? { $set: { archivedAt: new Date() } } : { $unset: { archivedAt: 1 } },
  );
  return result.matchedCount === 1;
}

/** Adds an internal note. Returns false when there is no such application, or it is archived. */
export async function addJobApplicationNote(
  id: string,
  actor: Actor,
  body: string,
): Promise<boolean> {
  await connectDb();
  const result = await JobApplicationModel.updateOne(
    { _id: id, ...NOT_ARCHIVED },
    {
      $push: {
        notes: { authorId: new mongoose.Types.ObjectId(actor.id), authorName: actor.name, body },
      },
    },
  );
  return result.matchedCount === 1;
}
