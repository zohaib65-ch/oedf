import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import type { AWARD_PERIODS, AWARD_STATUSES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";

type AwardStatus = (typeof AWARD_STATUSES)[number];
type AwardPeriod = (typeof AWARD_PERIODS)[number];

export interface NewAward {
  applicationId: string;
  referenceNumber: string;
  studentName: string;
  amountPkr: number;
  period: AwardPeriod;
  /** Days as YYYY-MM-DD. */
  startDate: string;
  renewalDate: string | null;
}

/** Records the award. It is a record only: the system never makes or tracks payments. */
export async function createAward(award: NewAward, session: ClientSession): Promise<string> {
  const { renewalDate, startDate, ...fields } = award;
  // Mongoose casts the ISO day strings to dates (UTC midnight).
  const created = await ScholarshipAwardModel.insertMany(
    [
      {
        ...fields,
        startDate: `${startDate}T00:00:00Z`,
        ...(renewalDate ? { renewalDate: `${renewalDate}T00:00:00Z` } : {}),
        status: "ACTIVE",
      },
    ],
    { session },
  );
  const [first] = created;
  if (!first) {
    throw new Error("The award was not created.");
  }
  return first._id.toString();
}

export interface AwardListItem {
  id: string;
  applicationId: string;
  referenceNumber: string;
  studentName: string;
  amountPkr: number;
  period: AwardPeriod;
  startDate: string;
  renewalDate: string | null;
  status: AwardStatus;
}

export interface AwardListOptions {
  q?: string | undefined;
  status?: AwardStatus | undefined;
  renewalBefore?: Date | undefined;
  sort: {
    field: "studentName" | "amountPkr" | "startDate" | "renewalDate";
    direction: "asc" | "desc";
  };
  page: number;
  pageSize: number;
}

const toDay = (date: Date) => date.toISOString().slice(0, 10);

function toListItem(award: {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  referenceNumber: string;
  studentName: string;
  amountPkr: number;
  period: AwardPeriod;
  startDate: Date;
  renewalDate?: Date | null;
  status: AwardStatus;
}): AwardListItem {
  return {
    id: award._id.toString(),
    applicationId: award.applicationId.toString(),
    referenceNumber: award.referenceNumber,
    studentName: award.studentName,
    amountPkr: award.amountPkr,
    period: award.period,
    startDate: toDay(award.startDate),
    renewalDate: award.renewalDate ? toDay(award.renewalDate) : null,
    status: award.status,
  };
}

const LIST_FIELDS = {
  applicationId: 1,
  referenceNumber: 1,
  studentName: 1,
  amountPkr: 1,
  period: 1,
  startDate: 1,
  renewalDate: 1,
  status: 1,
} as const;

export async function listAwards(
  options: AwardListOptions,
): Promise<{ items: AwardListItem[]; total: number }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (options.status) {
    filter.status = options.status;
  }
  if (options.renewalBefore) {
    // Built from a validated date, so the operator is not request input.
    filter.renewalDate = mongoose.trusted({ $lt: options.renewalBefore });
  }
  if (options.q) {
    const pattern = new RegExp(escapeRegExp(options.q), "i");
    filter.$or = mongoose.trusted([{ studentName: pattern }, { referenceNumber: pattern }]);
  }
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    ScholarshipAwardModel.find(filter, LIST_FIELDS)
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean(),
    ScholarshipAwardModel.countDocuments(filter),
  ]);
  return { items: rows.map(toListItem), total };
}

export interface AwardDetail extends AwardListItem {
  notes: { id: string; authorName: string; body: string; createdAt: string }[];
  createdAt: string;
}

export async function findAwardById(id: string): Promise<AwardDetail | null> {
  await connectDb();
  const award = await ScholarshipAwardModel.findById(id).lean();
  if (!award) {
    return null;
  }
  return {
    ...toListItem(award),
    notes: award.notes
      .map((note) => ({
        id: note._id.toString(),
        authorName: note.authorName,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
      }))
      .reverse(),
    createdAt: award.createdAt.toISOString(),
  };
}

export interface AwardChanges {
  amountPkr: number;
  period: AwardPeriod;
  startDate: Date;
  renewalDate: Date | null;
  status: AwardStatus;
}

export async function updateAward(id: string, changes: AwardChanges): Promise<void> {
  await connectDb();
  const { renewalDate, ...rest } = changes;
  await ScholarshipAwardModel.updateOne(
    { _id: id },
    renewalDate ? { $set: { ...rest, renewalDate } } : { $set: rest, $unset: { renewalDate: 1 } },
  );
}

/** Adds a progress note, such as a term result. Returns false when there is no such award. */
export async function addAwardNote(
  id: string,
  actor: { id: string; name: string },
  body: string,
): Promise<boolean> {
  await connectDb();
  const result = await ScholarshipAwardModel.updateOne(
    { _id: id },
    {
      $push: {
        notes: { authorId: new mongoose.Types.ObjectId(actor.id), authorName: actor.name, body },
      },
    },
  );
  return result.matchedCount === 1;
}
