import "server-only";
import mongoose from "mongoose";

import type { PUBLICATION_TYPES } from "@/lib/constants/enums";
import { PAGE_SIZE, type PublicationFilters } from "@/lib/validations/list-params";
import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import type { StoredImage } from "@/server/services/image.service";

export interface PublicationSummary {
  id: string;
  slug: string;
  title: string;
  type: (typeof PUBLICATION_TYPES)[number];
  summary: string;
  publishedOn: Date | null;
  cover: StoredImage | null;
}

export interface PublicationDetail extends PublicationSummary {
  authors: string[];
  tags: string[];
  /** Whether visitors can download the full PDF. */
  hasPdf: boolean;
}

export interface PublicationPage {
  items: PublicationSummary[];
  total: number;
}

const SUMMARY_FIELDS = {
  slug: 1,
  title: 1,
  type: 1,
  summary: 1,
  publishedOn: 1,
  cover: 1,
} as const;

function toSummary(publication: {
  _id: { toString(): string };
  slug: string;
  title: string;
  type: (typeof PUBLICATION_TYPES)[number];
  summary: string;
  publishedOn?: Date | null;
  cover?: StoredImage | null;
}): PublicationSummary {
  return {
    id: publication._id.toString(),
    slug: publication.slug,
    title: publication.title,
    type: publication.type,
    summary: publication.summary,
    publishedOn: publication.publishedOn ?? null,
    cover: publication.cover
      ? {
          publicId: publication.cover.publicId,
          width: publication.cover.width,
          height: publication.cover.height,
          alt: publication.cover.alt,
        }
      : null,
  };
}

export async function listPublishedPublications(
  filters: PublicationFilters,
): Promise<PublicationPage> {
  await connectDb();
  const filter = {
    status: "PUBLISHED" as const,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.year
      ? {
          publishedOn: mongoose.trusted({
            $gte: new Date(Date.UTC(filters.year, 0, 1)),
            $lt: new Date(Date.UTC(filters.year + 1, 0, 1)),
          }),
        }
      : {}),
    // The search text is user input, so it is marked trusted only inside this one $text operator.
    ...(filters.q ? { $text: mongoose.trusted({ $search: filters.q }) } : {}),
  };
  const [publications, total] = await Promise.all([
    PublicationModel.find(filter, SUMMARY_FIELDS)
      .sort({ publishedOn: -1, _id: -1 })
      .skip((filters.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    PublicationModel.countDocuments(filter),
  ]);
  return { items: publications.map(toSummary), total };
}

export async function listLatestPublications(limit: number): Promise<PublicationSummary[]> {
  await connectDb();
  const publications = await PublicationModel.find({ status: "PUBLISHED" }, SUMMARY_FIELDS)
    .sort({ publishedOn: -1, _id: -1 })
    .limit(limit)
    .lean();
  return publications.map(toSummary);
}

/** The years that have a published publication, newest first, for the filter. */
export async function listPublicationYears(): Promise<number[]> {
  await connectDb();
  const rows = await PublicationModel.aggregate<{ _id: number }>([
    { $match: { status: "PUBLISHED", publishedOn: { $type: "date" } } },
    { $group: { _id: { $year: "$publishedOn" } } },
    { $sort: { _id: -1 } },
  ]);
  return rows.map((row) => row._id);
}

export async function findPublishedPublicationBySlug(
  slug: string,
): Promise<PublicationDetail | null> {
  await connectDb();
  const publication = await PublicationModel.findOne(
    { slug, status: "PUBLISHED" },
    { ...SUMMARY_FIELDS, authors: 1, tags: 1, pdfFileId: 1 },
  ).lean();
  return publication
    ? {
        ...toSummary(publication),
        authors: publication.authors,
        tags: publication.tags,
        hasPdf: publication.pdfFileId != null,
      }
    : null;
}

/** The stored PDF of a published publication, or null when it is not published or has none. */
export async function findPublishedPdfBySlug(
  slug: string,
): Promise<{ publicId: string; resourceType: "image" | "raw"; format: string } | null> {
  await connectDb();
  const publication = await PublicationModel.findOne(
    { slug, status: "PUBLISHED" },
    { pdfFileId: 1 },
  ).lean();
  if (!publication?.pdfFileId) {
    return null;
  }
  const file = await FileAssetModel.findById(publication.pdfFileId, {
    publicId: 1,
    resourceType: 1,
    format: 1,
  }).lean();
  return file
    ? {
        publicId: file.publicId,
        resourceType: file.resourceType === "raw" ? "raw" : "image",
        format: file.format,
      }
    : null;
}
