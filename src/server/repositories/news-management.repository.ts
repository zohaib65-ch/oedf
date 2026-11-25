import "server-only";
import mongoose from "mongoose";

import type { CONTENT_STATUSES, NEWS_TYPES } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";
import type { StoredImage } from "@/server/services/image.service";

type NewsStatus = (typeof CONTENT_STATUSES)[number];
type NewsType = (typeof NEWS_TYPES)[number];

const toDay = (date: Date) => date.toISOString().slice(0, 10);

export interface StaffNewsListItem {
  id: string;
  slug: string;
  title: string;
  type: NewsType;
  status: NewsStatus;
  publishedAt: string | null;
  /** A day (YYYY-MM-DD), for events. */
  eventDate: string | null;
  authorName: string;
  updatedAt: string;
}

export interface StaffNewsListOptions {
  q?: string | undefined;
  status?: NewsStatus | undefined;
  type?: NewsType | undefined;
  sort: { field: "title" | "publishedAt" | "updatedAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

interface NewsRow {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  type: NewsType;
  status: NewsStatus;
  publishedAt?: Date | null;
  eventDate?: Date | null;
  authorName: string;
  updatedAt: Date;
}

function toListItem(row: NewsRow): StaffNewsListItem {
  return {
    id: row._id.toString(),
    slug: row.slug,
    title: row.title,
    type: row.type,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    eventDate: row.eventDate ? toDay(row.eventDate) : null,
    authorName: row.authorName,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const LIST_FIELDS = {
  slug: 1,
  title: 1,
  type: 1,
  status: 1,
  publishedAt: 1,
  eventDate: 1,
  authorName: 1,
  updatedAt: 1,
} as const;

/** Every news post and event, drafts and archived ones included. */
export async function listNewsForStaff(
  options: StaffNewsListOptions,
): Promise<{ items: StaffNewsListItem[]; total: number }> {
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
    NewsPostModel.find(filter, LIST_FIELDS)
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean<NewsRow[]>(),
    NewsPostModel.countDocuments(filter),
  ]);
  return { total, items: rows.map(toListItem) };
}

export interface StaffNewsDetail extends StaffNewsListItem {
  excerpt: string;
  eventStartTime: string;
  body: string;
  venue: string;
  seoTitle: string;
  seoDescription: string;
  cover: StoredImage | null;
  createdAt: string;
}

export async function findNewsForStaff(id: string): Promise<StaffNewsDetail | null> {
  await connectDb();
  const post = await NewsPostModel.findById(id).lean();
  if (!post) {
    return null;
  }
  return {
    ...toListItem(post),
    excerpt: post.excerpt,
    eventStartTime: post.eventStartTime,
    body: post.body,
    venue: post.venue,
    seoTitle: post.seo.title,
    seoDescription: post.seo.description,
    cover: post.cover
      ? {
          publicId: post.cover.publicId,
          width: post.cover.width,
          height: post.cover.height,
          alt: post.cover.alt,
        }
      : null,
    createdAt: post.createdAt.toISOString(),
  };
}

export interface NewsFields {
  title: string;
  type: NewsType;
  excerpt: string;
  body: string;
  /** UTC midnight of the event's day, or null. */
  eventDate: Date | null;
  /** "HH:mm" or empty. */
  eventStartTime: string;
  venue: string;
  status: NewsStatus;
  publishedAt: Date | null;
  seoTitle: string;
  seoDescription: string;
  cover: StoredImage | null;
}

function toUpdate(fields: NewsFields) {
  const { cover, eventDate, publishedAt, seoTitle, seoDescription, ...rest } = fields;
  const set = {
    ...rest,
    seo: { title: seoTitle, description: seoDescription },
    ...(cover ? { cover } : {}),
    ...(eventDate ? { eventDate } : {}),
    ...(publishedAt ? { publishedAt } : {}),
  };
  const unset = {
    ...(cover ? {} : { cover: 1 }),
    ...(eventDate ? {} : { eventDate: 1 }),
    ...(publishedAt ? {} : { publishedAt: 1 }),
  };
  return { set, unset };
}

/** Saves a new post and returns its ID. */
export async function createNews(
  slug: string,
  author: { id: string; name: string },
  fields: NewsFields,
): Promise<string> {
  await connectDb();
  const [created] = await NewsPostModel.insertMany([
    {
      ...toUpdate(fields).set,
      slug,
      authorId: new mongoose.Types.ObjectId(author.id),
      authorName: author.name,
    },
  ]);
  if (!created) {
    throw new Error("The news post was not created.");
  }
  return created._id.toString();
}

/** Saves the fields while the post still has the status the caller saw. Returns false otherwise. */
export async function updateNews(
  id: string,
  expectedStatus: NewsStatus,
  fields: NewsFields,
): Promise<boolean> {
  await connectDb();
  const { set, unset } = toUpdate(fields);
  const result = await NewsPostModel.updateOne(
    { _id: id, status: expectedStatus },
    Object.keys(unset).length > 0 ? { $set: set, $unset: unset } : { $set: set },
  );
  return result.matchedCount === 1;
}

/** Deletes the post while it still has the status the caller saw. */
export async function deleteNews(id: string, expectedStatus: NewsStatus): Promise<boolean> {
  await connectDb();
  const result = await NewsPostModel.deleteOne({ _id: id, status: expectedStatus });
  return result.deletedCount === 1;
}
