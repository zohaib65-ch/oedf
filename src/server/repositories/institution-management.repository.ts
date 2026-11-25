import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import type {
  AGREEMENT_STATUSES,
  INSTITUTION_STATUSES,
  INSTITUTION_TYPES,
} from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import type { StoredImage } from "@/server/services/image.service";

type InstitutionStatus = (typeof INSTITUTION_STATUSES)[number];
type InstitutionType = (typeof INSTITUTION_TYPES)[number];
type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

const toDay = (date: Date) => date.toISOString().slice(0, 10);
/** A stored day (YYYY-MM-DD) is saved as UTC midnight, like every other date-only field. */
const fromDay = (day: string) => new Date(`${day}T00:00:00Z`);

export interface StaffInstitutionListItem {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
  city: string;
  status: InstitutionStatus;
  isPublic: boolean;
  agreementCount: number;
  reviewCount: number;
  /** The soonest agreement renewal still ahead, as a day, or null. */
  nextRenewal: string | null;
  averageRating: number | null;
  updatedAt: string;
}

export interface StaffInstitutionListOptions {
  q?: string | undefined;
  status?: InstitutionStatus | undefined;
  type?: InstitutionType | undefined;
  sort: { field: "name" | "city" | "updatedAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
  now: Date;
}

interface InstitutionRow {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  type: InstitutionType;
  city: string;
  status: InstitutionStatus;
  isPublic: boolean;
  agreements: { renewalDate?: Date | null }[];
  reviews: { rating: number }[];
  updatedAt: Date;
}

function toListItem(row: InstitutionRow, now: Date): StaffInstitutionListItem {
  const renewals = row.agreements
    .map((agreement) => agreement.renewalDate)
    .filter((date): date is Date => date instanceof Date && date >= now)
    .sort((a, b) => a.getTime() - b.getTime());
  const ratings = row.reviews.map((review) => review.rating);
  return {
    id: row._id.toString(),
    slug: row.slug,
    name: row.name,
    type: row.type,
    city: row.city,
    status: row.status,
    isPublic: row.isPublic,
    agreementCount: row.agreements.length,
    reviewCount: ratings.length,
    nextRenewal: renewals[0] ? toDay(renewals[0]) : null,
    averageRating:
      ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const LIST_FIELDS = {
  slug: 1,
  name: 1,
  type: 1,
  city: 1,
  status: 1,
  isPublic: 1,
  "agreements.renewalDate": 1,
  "reviews.rating": 1,
  updatedAt: 1,
} as const;

/** Every institution, public or not, with its agreements and ratings summarised. */
export async function listInstitutionsForStaff(
  options: StaffInstitutionListOptions,
): Promise<{ items: StaffInstitutionListItem[]; total: number }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (options.status) {
    filter.status = options.status;
  }
  if (options.type) {
    filter.type = options.type;
  }
  if (options.q) {
    const pattern = new RegExp(escapeRegExp(options.q), "i");
    filter.$or = mongoose.trusted([{ name: pattern }, { city: pattern }]);
  }
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    InstitutionModel.find(filter, LIST_FIELDS)
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean<InstitutionRow[]>(),
    InstitutionModel.countDocuments(filter),
  ]);
  return { total, items: rows.map((row) => toListItem(row, options.now)) };
}

export interface AgreementRecord {
  id: string;
  title: string;
  partner: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  status: AgreementStatus;
  document: { fileId: string; publicId: string; originalName: string } | null;
}

interface ReviewRecord {
  id: string;
  reviewDate: string;
  rating: number;
  summary: string;
  reviewerName: string;
}

export interface StaffInstitutionDetail extends StaffInstitutionListItem {
  address: string;
  description: string;
  image: StoredImage | null;
  agreements: AgreementRecord[];
  /** Newest first. */
  reviews: ReviewRecord[];
  /** Programs that list this institution, for the page's links. */
  programs: { id: string; title: string }[];
  createdAt: string;
}

export async function findInstitutionForStaff(
  id: string,
  now: Date,
): Promise<StaffInstitutionDetail | null> {
  await connectDb();
  const institution = await InstitutionModel.findById(id).lean();
  if (!institution) {
    return null;
  }
  const documentIds = institution.agreements
    .map((agreement) => agreement.documentFileId)
    .filter((fileId): fileId is mongoose.Types.ObjectId => fileId != null);
  const [files, programs] = await Promise.all([
    FileAssetModel.find(
      { _id: mongoose.trusted({ $in: documentIds }) },
      { publicId: 1, originalName: 1 },
    ).lean(),
    ProgramModel.find({ institutionIds: institution._id }, { title: 1 }).sort({ title: 1 }).lean(),
  ]);
  const fileById = new Map(files.map((file) => [file._id.toString(), file]));

  return {
    ...toListItem(institution, now),
    address: institution.address,
    description: institution.description,
    image: institution.image
      ? {
          publicId: institution.image.publicId,
          width: institution.image.width,
          height: institution.image.height,
          alt: institution.image.alt,
        }
      : null,
    agreements: institution.agreements.map((agreement) => {
      const file = agreement.documentFileId
        ? fileById.get(agreement.documentFileId.toString())
        : undefined;
      return {
        id: agreement._id.toString(),
        title: agreement.title,
        partner: agreement.partner,
        startDate: toDay(agreement.startDate),
        endDate: agreement.endDate ? toDay(agreement.endDate) : null,
        renewalDate: agreement.renewalDate ? toDay(agreement.renewalDate) : null,
        status: agreement.status,
        document: file
          ? {
              fileId: file._id.toString(),
              publicId: file.publicId,
              originalName: file.originalName,
            }
          : null,
      };
    }),
    reviews: institution.reviews
      .map((review) => ({
        id: review._id.toString(),
        reviewDate: toDay(review.date),
        rating: review.rating,
        summary: review.summary,
        reviewerName: review.reviewerName,
      }))
      .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate)),
    programs: programs.map((program) => ({ id: program._id.toString(), title: program.title })),
    createdAt: institution.createdAt.toISOString(),
  };
}

export interface InstitutionFields {
  name: string;
  type: InstitutionType;
  city: string;
  address: string;
  description: string;
  status: InstitutionStatus;
  isPublic: boolean;
  image: StoredImage | null;
}

/** Saves a new institution and returns its ID. */
export async function createInstitution(slug: string, fields: InstitutionFields): Promise<string> {
  await connectDb();
  const { image, ...rest } = fields;
  const [created] = await InstitutionModel.insertMany([
    { ...rest, slug, ...(image ? { image } : {}) },
  ]);
  if (!created) {
    throw new Error("The institution was not created.");
  }
  return created._id.toString();
}

/**
 * Saves the fields while the institution is still public or not, as the caller saw it, so a
 * change of visibility by someone else is never overwritten. Returns false otherwise.
 */
export async function updateInstitution(
  id: string,
  expectedIsPublic: boolean,
  fields: InstitutionFields,
): Promise<boolean> {
  await connectDb();
  const { image, ...rest } = fields;
  const result = await InstitutionModel.updateOne(
    { _id: id, isPublic: expectedIsPublic },
    image ? { $set: { ...rest, image } } : { $set: rest, $unset: { image: 1 } },
  );
  return result.matchedCount === 1;
}

/**
 * Deletes the institution while it is still as public as the caller saw and still has no
 * agreements or reviews, and takes it off every program that lists it, in one transaction.
 */
export async function deleteInstitution(
  id: string,
  expectedIsPublic: boolean,
  session: ClientSession,
): Promise<boolean> {
  const result = await InstitutionModel.deleteOne(
    {
      _id: id,
      isPublic: expectedIsPublic,
      agreements: mongoose.trusted({ $size: 0 }),
      reviews: mongoose.trusted({ $size: 0 }),
    },
    { session },
  );
  if (result.deletedCount !== 1) {
    return false;
  }
  await ProgramModel.updateMany(
    { institutionIds: id },
    { $pull: { institutionIds: id } },
    { session },
  );
  return true;
}

export interface AgreementFields {
  title: string;
  partner: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  status: AgreementStatus;
  documentFileId: string | null;
}

function toAgreementDocument(fields: AgreementFields) {
  return {
    title: fields.title,
    partner: fields.partner,
    startDate: fromDay(fields.startDate),
    endDate: fields.endDate ? fromDay(fields.endDate) : null,
    renewalDate: fields.renewalDate ? fromDay(fields.renewalDate) : null,
    status: fields.status,
    documentFileId: fields.documentFileId
      ? new mongoose.Types.ObjectId(fields.documentFileId)
      : null,
  };
}

/** Adds an agreement. Returns false when there is no such institution. */
export async function addAgreement(
  id: string,
  agreementId: string,
  fields: AgreementFields,
  session: ClientSession,
): Promise<boolean> {
  const result = await InstitutionModel.updateOne(
    { _id: id },
    {
      $push: {
        agreements: {
          _id: new mongoose.Types.ObjectId(agreementId),
          ...toAgreementDocument(fields),
        },
      },
    },
    { session },
  );
  return result.matchedCount === 1;
}

/** Replaces one agreement's fields. Returns false when the institution or agreement is gone. */
export async function updateAgreement(
  id: string,
  agreementId: string,
  fields: AgreementFields,
  session: ClientSession,
): Promise<boolean> {
  const document = toAgreementDocument(fields);
  const result = await InstitutionModel.updateOne(
    { _id: id, "agreements._id": new mongoose.Types.ObjectId(agreementId) },
    {
      $set: Object.fromEntries(
        Object.entries(document).map(([key, value]) => [`agreements.$.${key}`, value]),
      ),
    },
    { session },
  );
  return result.matchedCount === 1;
}

/** Adds a performance review. Returns false when there is no such institution. */
export async function addReview(
  id: string,
  review: {
    reviewDate: string;
    rating: number;
    summary: string;
    reviewer: { id: string; name: string };
  },
): Promise<boolean> {
  await connectDb();
  const result = await InstitutionModel.updateOne(
    { _id: id },
    {
      $push: {
        reviews: {
          date: fromDay(review.reviewDate),
          rating: review.rating,
          summary: review.summary,
          reviewerId: new mongoose.Types.ObjectId(review.reviewer.id),
          reviewerName: review.reviewer.name,
        },
      },
    },
  );
  return result.matchedCount === 1;
}
