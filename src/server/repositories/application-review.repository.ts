import "server-only";
import mongoose, { type ClientSession, type PipelineStage } from "mongoose";

import type {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  DOCUMENT_KINDS,
  GENDERS,
} from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import { buildTimeline, type TimelineEntry } from "@/server/lib/timeline";

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type ApplicationType = (typeof APPLICATION_TYPES)[number];

const CNIC_DIGITS = 13;
const CNIC_LAST_DIGITS = 4;

const SORT_PATHS = {
  referenceNumber: "referenceNumber",
  name: "applicant.fullName",
  status: "status",
  createdAt: "createdAt",
} as const;

export interface ApplicationListOptions {
  q?: string | undefined;
  type?: ApplicationType | undefined;
  status?: ApplicationStatus | undefined;
  programId?: string | undefined;
  city?: string | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  /** Archived applications only, or (by default) the ones still in use. */
  isArchived: boolean;
  sort: { field: keyof typeof SORT_PATHS; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

/** A row of the staff list. Only the last four CNIC digits ever leave the database. */
export interface ApplicationListItem {
  id: string;
  referenceNumber: string;
  type: ApplicationType;
  status: ApplicationStatus;
  applicantName: string;
  city: string;
  cnicLast4: string;
  programTitle: string | null;
  createdAt: string;
}

/**
 * The search box finds a CNIC (13 digits, with or without dashes) exactly, and otherwise matches
 * part of the applicant's name or reference number.
 */
function searchCondition(q: string): Record<string, unknown> {
  const digits = q.replaceAll("-", "");
  if (/^\d+$/.test(digits) && digits.length === CNIC_DIGITS) {
    return { "applicant.cnic": digits };
  }
  const pattern = new RegExp(escapeRegExp(q), "i");
  return { $or: [{ "applicant.fullName": pattern }, { referenceNumber: pattern }] };
}

// Built only from validated values (enums, an ObjectId, dates and escaped text), never raw input.
// Operator objects are marked trusted: the global `sanitizeFilter` would otherwise rewrite them, in
// place, as soon as the count query is created.
function toMatch(options: ApplicationListOptions): Record<string, unknown> {
  const match: Record<string, unknown> = {
    archivedAt: mongoose.trusted({ $exists: options.isArchived }),
  };
  if (options.type) {
    match.type = options.type;
  }
  if (options.status) {
    match.status = options.status;
  }
  if (options.programId) {
    match.programId = new mongoose.Types.ObjectId(options.programId);
  }
  if (options.city) {
    match["applicant.city"] = new RegExp(`^${escapeRegExp(options.city)}$`, "i");
  }
  if (options.from || options.to) {
    match.createdAt = mongoose.trusted({
      ...(options.from ? { $gte: options.from } : {}),
      ...(options.to ? { $lt: options.to } : {}),
    });
  }
  return options.q ? { $and: [match, searchCondition(options.q)] } : match;
}

export async function listApplicationsForReview(
  options: ApplicationListOptions,
): Promise<{ items: ApplicationListItem[]; total: number }> {
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
        from: ProgramModel.collection.name,
        localField: "programId",
        foreignField: "_id",
        as: "program",
        pipeline: [{ $project: { title: 1 } }],
      },
    },
    {
      $project: {
        referenceNumber: 1,
        type: 1,
        status: 1,
        createdAt: 1,
        applicantName: "$applicant.fullName",
        city: "$applicant.city",
        cnicLast4: {
          $substrCP: ["$applicant.cnic", CNIC_DIGITS - CNIC_LAST_DIGITS, CNIC_LAST_DIGITS],
        },
        programTitle: { $first: "$program.title" },
      },
    },
  ];
  const [rows, total] = await Promise.all([
    ApplicationModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      referenceNumber: string;
      type: ApplicationType;
      status: ApplicationStatus;
      createdAt: Date;
      applicantName: string;
      city: string;
      cnicLast4: string;
      programTitle?: string;
    }>(pipeline),
    ApplicationModel.countDocuments(match),
  ]);
  return {
    total,
    items: rows.map((row) => ({
      id: row._id.toString(),
      referenceNumber: row.referenceNumber,
      type: row.type,
      status: row.status,
      applicantName: row.applicantName,
      city: row.city,
      cnicLast4: row.cnicLast4,
      programTitle: row.programTitle ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export interface ApplicationDocumentRecord {
  fileId: string;
  kind: (typeof DOCUMENT_KINDS)[number];
  originalName: string;
  format: string;
  bytes: number;
}

/** Everything staff see on an application's page. Only for people allowed to read applications. */
export interface ApplicationDetail {
  id: string;
  referenceNumber: string;
  type: ApplicationType;
  status: ApplicationStatus;
  program: { id: string; title: string } | null;
  intakeSession: string;
  applicant: {
    fullName: string;
    guardianName: string;
    dateOfBirth: string;
    gender: (typeof GENDERS)[number];
    cnic: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  education: {
    lastInstitution: string;
    classOrDegree: string;
    boardOrUniversity: string;
    marksOrPercentage: string;
    passingYear: number;
  };
  financial: {
    monthlyIncomePkr: number;
    familySize: number;
    guardianOccupation: string;
    otherSupport: string;
    statementOfNeed: string;
  } | null;
  documents: ApplicationDocumentRecord[];
  checklist: { identity: boolean; education: boolean; eligibility: boolean; documents: boolean };
  missingItems: string[];
  decision: { reason: string; decidedByName: string; decidedAt: string } | null;
  awardId: string | null;
  archivedAt: string | null;
  timeline: TimelineEntry<ApplicationStatus>[];
  createdAt: string;
}

export async function findApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  await connectDb();
  const application = await ApplicationModel.findById(id).lean();
  if (!application) {
    return null;
  }
  const fileIds = application.documents.map((document) => document.fileId);
  const [files, program, award] = await Promise.all([
    FileAssetModel.find(
      { _id: mongoose.trusted({ $in: fileIds }) },
      { originalName: 1, format: 1, bytes: 1 },
    ).lean(),
    application.programId
      ? ProgramModel.findById(application.programId, { title: 1 }).lean()
      : Promise.resolve(null),
    ScholarshipAwardModel.findOne({ applicationId: application._id }, { _id: 1 }).lean(),
  ]);
  const fileById = new Map(files.map((file) => [file._id.toString(), file]));

  return {
    id: application._id.toString(),
    referenceNumber: application.referenceNumber,
    type: application.type,
    status: application.status,
    program: program ? { id: program._id.toString(), title: program.title } : null,
    intakeSession: application.intakeSession,
    applicant: {
      ...application.applicant,
      dateOfBirth: application.applicant.dateOfBirth.toISOString().slice(0, 10),
    },
    education: application.education,
    financial: application.financial ?? null,
    documents: application.documents.map((document) => {
      const file = fileById.get(document.fileId.toString());
      return {
        fileId: document.fileId.toString(),
        kind: document.kind,
        originalName: file?.originalName ?? "Unknown file",
        format: file?.format ?? "",
        bytes: file?.bytes ?? 0,
      };
    }),
    checklist: application.checklist,
    missingItems: application.missingItems,
    decision: application.decision
      ? {
          reason: application.decision.reason,
          decidedByName: application.decision.decidedByName,
          decidedAt: application.decision.decidedAt.toISOString(),
        }
      : null,
    awardId: award ? award._id.toString() : null,
    archivedAt: application.archivedAt ? application.archivedAt.toISOString() : null,
    timeline: buildTimeline<ApplicationStatus>(application.statusHistory, application.notes),
    createdAt: application.createdAt.toISOString(),
  };
}

interface Actor {
  id: string;
  name: string;
}

const NOT_ARCHIVED = { archivedAt: mongoose.trusted({ $exists: false }) };

/**
 * Saves the checklist, only while the application is in one of the given statuses. Returns false
 * when it was not (it moved on in the meantime), so nothing changed.
 */
export async function saveChecklist(
  id: string,
  checklist: ApplicationDetail["checklist"],
  editableStatuses: readonly ApplicationStatus[],
): Promise<boolean> {
  await connectDb();
  const result = await ApplicationModel.updateOne(
    { _id: id, status: mongoose.trusted({ $in: editableStatuses }), ...NOT_ARCHIVED },
    { $set: { checklist } },
  );
  return result.matchedCount === 1;
}

export interface StatusChange {
  from: ApplicationStatus;
  to: ApplicationStatus;
  reason: string;
  actor: Actor;
  /** Replaces the list of missing items (cleared when not Incomplete). */
  missingItems: string[];
  /** The checklist must be complete, checked in the same write (moving to Verified). */
  requiresCompleteChecklist: boolean;
  isDecision: boolean;
}

/**
 * Moves the application from `from` to `to` and records who, when and why. The write matches the
 * expected current status, so two people acting at once cannot both succeed. Returns false then.
 */
export async function changeApplicationStatus(
  id: string,
  change: StatusChange,
  session: ClientSession,
): Promise<boolean> {
  const filter: Record<string, unknown> = { _id: id, status: change.from, ...NOT_ARCHIVED };
  if (change.requiresCompleteChecklist) {
    Object.assign(filter, {
      "checklist.identity": true,
      "checklist.education": true,
      "checklist.eligibility": true,
      "checklist.documents": true,
    });
  }
  const actorId = new mongoose.Types.ObjectId(change.actor.id);
  const result = await ApplicationModel.updateOne(
    filter,
    {
      $set: {
        status: change.to,
        missingItems: change.missingItems,
        ...(change.isDecision
          ? {
              decision: {
                reason: change.reason,
                decidedById: actorId,
                decidedByName: change.actor.name,
                decidedAt: new Date(),
              },
            }
          : {}),
      },
      $push: {
        statusHistory: {
          from: change.from,
          to: change.to,
          reason: change.reason,
          actorId,
          actorName: change.actor.name,
        },
      },
    },
    { session },
  );
  return result.modifiedCount === 1;
}

/** Adds an internal note. Returns false when there is no such application, or it is archived. */
export async function addApplicationNote(id: string, actor: Actor, body: string): Promise<boolean> {
  await connectDb();
  const result = await ApplicationModel.updateOne(
    { _id: id, ...NOT_ARCHIVED },
    {
      $push: {
        notes: { authorId: new mongoose.Types.ObjectId(actor.id), authorName: actor.name, body },
      },
    },
  );
  return result.matchedCount === 1;
}

/** Archives the application, or restores it. Nothing is ever deleted. */
export async function setApplicationArchived(id: string, isArchived: boolean): Promise<boolean> {
  await connectDb();
  const result = await ApplicationModel.updateOne(
    { _id: id },
    isArchived ? { $set: { archivedAt: new Date() } } : { $unset: { archivedAt: 1 } },
  );
  return result.matchedCount === 1;
}
