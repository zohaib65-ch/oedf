import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import type { CONTENT_STATUSES, PUBLICATION_TYPES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import type { StoredImage } from "@/server/services/image.service";

type PublicationStatus = (typeof CONTENT_STATUSES)[number];
type PublicationType = (typeof PUBLICATION_TYPES)[number];

const toDay = (date: Date) => date.toISOString().slice(0, 10);
/** A stored day (YYYY-MM-DD) is saved as UTC midnight, like every other date-only field. */
const fromDay = (day: string) => new Date(`${day}T00:00:00Z`);

export interface StaffPublicationListItem {
  id: string;
  slug: string;
  title: string;
  type: PublicationType;
  status: PublicationStatus;
  /** A day (YYYY-MM-DD), or null until it is published. */
  publishedOn: string | null;
  hasPdf: boolean;
  updatedAt: string;
}

export interface StaffPublicationListOptions {
  q?: string | undefined;
  status?: PublicationStatus | undefined;
  type?: PublicationType | undefined;
  sort: { field: "title" | "publishedOn" | "updatedAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

interface PublicationRow {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  type: PublicationType;
  status: PublicationStatus;
  publishedOn?: Date | null;
  pdfFileId?: mongoose.Types.ObjectId | null;
  updatedAt: Date;
}

function toListItem(row: PublicationRow): StaffPublicationListItem {
  return {
    id: row._id.toString(),
    slug: row.slug,
    title: row.title,
    type: row.type,
    status: row.status,
    publishedOn: row.publishedOn ? toDay(row.publishedOn) : null,
    hasPdf: row.pdfFileId != null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const LIST_FIELDS = {
  slug: 1,
  title: 1,
  type: 1,
  status: 1,
  publishedOn: 1,
  pdfFileId: 1,
  updatedAt: 1,
} as const;

/** Every publication, drafts and archived ones included. */
export async function listPublicationsForStaff(
  options: StaffPublicationListOptions,
): Promise<{ items: StaffPublicationListItem[]; total: number }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (options.status) {
    filter.status = options.status;
  }
  if (options.type) {
    filter.type = options.type;
  }
  if (options.q) {
    filter.title = new RegExp(escapeRegExp(options.q), "i");
  }
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    PublicationModel.find(filter, LIST_FIELDS)
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean<PublicationRow[]>(),
    PublicationModel.countDocuments(filter),
  ]);
  return { total, items: rows.map(toListItem) };
}

export interface PublicationPdf {
  fileId: string;
  publicId: string;
  resourceType: "image" | "raw";
  originalName: string;
}

export interface StaffPublicationDetail extends StaffPublicationListItem {
  summary: string;
  authors: string[];
  tags: string[];
  pdf: PublicationPdf | null;
  cover: StoredImage | null;
  createdAt: string;
}

export async function findPublicationForStaff(id: string): Promise<StaffPublicationDetail | null> {
  await connectDb();
  const publication = await PublicationModel.findById(id).lean();
  if (!publication) {
    return null;
  }
  const file = publication.pdfFileId
    ? await FileAssetModel.findById(publication.pdfFileId, {
        publicId: 1,
        resourceType: 1,
        originalName: 1,
      }).lean()
    : null;
  return {
    ...toListItem(publication),
    summary: publication.summary,
    authors: publication.authors,
    tags: publication.tags,
    pdf: file
      ? {
          fileId: file._id.toString(),
          publicId: file.publicId,
          resourceType: file.resourceType === "raw" ? "raw" : "image",
          originalName: file.originalName,
        }
      : null,
    cover: publication.cover
      ? {
          publicId: publication.cover.publicId,
          width: publication.cover.width,
          height: publication.cover.height,
          alt: publication.cover.alt,
        }
      : null,
    createdAt: publication.createdAt.toISOString(),
  };
}

export interface PublicationFields {
  title: string;
  type: PublicationType;
  summary: string;
  authors: string[];
  tags: string[];
  /** A day (YYYY-MM-DD), or null. */
  publishedOn: string | null;
  pdfFileId: string | null;
  status: PublicationStatus;
  cover: StoredImage | null;
}

function toDocument(fields: PublicationFields) {
  const { cover, pdfFileId, publishedOn, ...rest } = fields;
  return {
    set: {
      ...rest,
      ...(cover ? { cover } : {}),
      ...(pdfFileId ? { pdfFileId: new mongoose.Types.ObjectId(pdfFileId) } : {}),
      ...(publishedOn ? { publishedOn: fromDay(publishedOn) } : {}),
    },
    unset: {
      ...(cover ? {} : { cover: 1 }),
      ...(pdfFileId ? {} : { pdfFileId: 1 }),
      ...(publishedOn ? {} : { publishedOn: 1 }),
    },
  };
}

/** Saves a new publication with the given ID. */
export async function createPublication(
  id: string,
  slug: string,
  fields: PublicationFields,
  session: ClientSession,
): Promise<void> {
  const { set } = toDocument(fields);
  await PublicationModel.insertMany([{ _id: new mongoose.Types.ObjectId(id), slug, ...set }], {
    session,
  });
}

/** Saves the fields while the publication still has the status the caller saw. Returns false otherwise. */
export async function updatePublication(
  id: string,
  expectedStatus: PublicationStatus,
  fields: PublicationFields,
  session: ClientSession,
): Promise<boolean> {
  const { set, unset } = toDocument(fields);
  const result = await PublicationModel.updateOne(
    { _id: id, status: expectedStatus },
    Object.keys(unset).length > 0 ? { $set: set, $unset: unset } : { $set: set },
    { session },
  );
  return result.matchedCount === 1;
}

/** Deletes the publication while it still has the status the caller saw. */
export async function deletePublication(
  id: string,
  expectedStatus: PublicationStatus,
  session: ClientSession,
): Promise<boolean> {
  const result = await PublicationModel.deleteOne({ _id: id, status: expectedStatus }, { session });
  return result.deletedCount === 1;
}
