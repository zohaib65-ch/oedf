import "server-only";

import type { NEWS_TYPES } from "@/lib/constants/enums";
import { PAGE_SIZE, type NewsFilters } from "@/lib/validations/list-params";
import { connectDb } from "@/server/db/connection";
import { NewsPostModel } from "@/server/db/models/news-post.model";

export interface NewsSummary {
  id: string;
  slug: string;
  title: string;
  type: (typeof NEWS_TYPES)[number];
  excerpt: string;
  publishedAt: Date | null;
  eventDate: Date | null;
}

export interface NewsDetail extends NewsSummary {
  body: string;
  venue: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
}

export interface NewsPage {
  items: NewsSummary[];
  total: number;
}

const SUMMARY_FIELDS = {
  slug: 1,
  title: 1,
  type: 1,
  excerpt: 1,
  publishedAt: 1,
  eventDate: 1,
} as const;

function toSummary(post: {
  _id: { toString(): string };
  slug: string;
  title: string;
  type: (typeof NEWS_TYPES)[number];
  excerpt: string;
  publishedAt?: Date | null;
  eventDate?: Date | null;
}): NewsSummary {
  return {
    id: post._id.toString(),
    slug: post.slug,
    title: post.title,
    type: post.type,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt ?? null,
    eventDate: post.eventDate ?? null,
  };
}

export async function listPublishedNews(filters: NewsFilters): Promise<NewsPage> {
  await connectDb();
  const filter = { status: "PUBLISHED" as const, ...(filters.type ? { type: filters.type } : {}) };
  const [posts, total] = await Promise.all([
    NewsPostModel.find(filter, SUMMARY_FIELDS)
      .sort({ publishedAt: -1, _id: -1 })
      .skip((filters.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    NewsPostModel.countDocuments(filter),
  ]);
  return { items: posts.map(toSummary), total };
}

export async function listLatestNews(limit: number): Promise<NewsSummary[]> {
  await connectDb();
  const posts = await NewsPostModel.find({ status: "PUBLISHED" }, SUMMARY_FIELDS)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  return posts.map(toSummary);
}

export async function findPublishedNewsBySlug(slug: string): Promise<NewsDetail | null> {
  await connectDb();
  const post = await NewsPostModel.findOne(
    { slug, status: "PUBLISHED" },
    { ...SUMMARY_FIELDS, body: 1, venue: 1, authorName: 1, seo: 1 },
  ).lean();
  return post
    ? {
        ...toSummary(post),
        body: post.body,
        venue: post.venue,
        authorName: post.authorName,
        seoTitle: post.seo.title,
        seoDescription: post.seo.description,
      }
    : null;
}
