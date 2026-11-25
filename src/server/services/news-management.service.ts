import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import { parseSort } from "@/lib/validations/common";
import type { ListNewsQuery, NewsFormInput } from "@/lib/validations/news";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  createNews as createNewsRecord,
  deleteNews as deleteNewsRecord,
  findNewsForStaff,
  listNewsForStaff,
  updateNews as updateNewsRecord,
  type NewsFields,
  type StaffNewsDetail,
  type StaffNewsListItem,
} from "@/server/repositories/news-management.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { resolveImage, settleImage } from "@/server/services/image.service";
import { uniqueSlug } from "@/server/services/slug.service";

const ENTITY_TYPE = "NewsPost";
const STALE_MESSAGE = "This post was changed by someone else. Reload the page and try again.";
// Route handlers cannot use `updateTag`, so the public pages are expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);
/** A stored day (YYYY-MM-DD) is saved as UTC midnight, like every other date-only field. */
const fromDay = (day: string) => new Date(`${day}T00:00:00Z`);

function assertMayManage(staff: StaffContext): void {
  if (!hasPermission(staff, "news:manage")) {
    throw new AppError("FORBIDDEN", "Only the CEO Office manages news and events.");
  }
}

export function getNewsForStaff(
  query: ListNewsQuery,
): Promise<{ items: StaffNewsListItem[]; total: number }> {
  return listNewsForStaff({
    q: query.q,
    status: query.status,
    type: query.type,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getNewsPostForStaff(id: string): Promise<StaffNewsDetail> {
  const post = isObjectId(id) ? await findNewsForStaff(id) : null;
  if (!post) {
    throw new AppError("NOT_FOUND", "This news post could not be found.");
  }
  return post;
}

/**
 * The publish moment: the day typed in the form, or the moment it was first published. An
 * unchanged day keeps the stored time, so the order on the public list does not shift.
 */
function resolvePublishedAt(input: NewsFormInput, current: StaffNewsDetail | null): Date | null {
  const stored = current?.publishedAt ? new Date(current.publishedAt) : null;
  if (input.publishedOn) {
    return stored && stored.toISOString().slice(0, 10) === input.publishedOn
      ? stored
      : fromDay(input.publishedOn);
  }
  if (input.status === "DRAFT") {
    return null;
  }
  return stored ?? new Date();
}

async function toFields(
  input: NewsFormInput,
  current: StaffNewsDetail | null,
): Promise<NewsFields> {
  return {
    title: input.title,
    type: input.type,
    excerpt: input.excerpt,
    body: input.body,
    // Only events have a date and venue.
    eventDate: input.type === "EVENT" && input.eventDate ? fromDay(input.eventDate) : null,
    eventStartTime: input.type === "EVENT" ? input.eventStartTime : "",
    venue: input.type === "EVENT" ? input.venue : "",
    status: input.status,
    publishedAt: resolvePublishedAt(input, current),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    cover: await resolveImage(current?.cover ?? null, {
      image: input.image,
      imageAlt: input.imageAlt,
    }),
  };
}

function expirePublicPages(): void {
  revalidateTag(CACHE_TAGS.news, EXPIRE_NOW);
}

export async function createNewsPost(
  staff: StaffContext,
  input: NewsFormInput,
): Promise<StaffNewsDetail> {
  assertMayManage(staff);
  const fields = await toFields(input, null);
  const id = await createNewsRecord(
    await uniqueSlug("news", input.title),
    { id: staff.id, name: staff.name },
    fields,
  );
  await settleImage(null, fields.cover);
  await recordAudit(staff, {
    action: "news.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: input.title, status: input.status },
  });
  if (input.status !== "DRAFT") {
    expirePublicPages();
  }
  return getNewsPostForStaff(id);
}

function changedFields(post: StaffNewsDetail, fields: NewsFields): string[] {
  const before: Record<string, unknown> = {
    title: post.title,
    type: post.type,
    excerpt: post.excerpt,
    body: post.body,
    eventDate: post.eventDate,
    eventStartTime: post.eventStartTime,
    venue: post.venue,
    status: post.status,
    publishedAt: post.publishedAt,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    cover: post.cover ? `${post.cover.publicId}|${post.cover.alt}` : "",
  };
  const after: Record<string, unknown> = {
    ...fields,
    eventDate: fields.eventDate ? fields.eventDate.toISOString().slice(0, 10) : null,
    publishedAt: fields.publishedAt ? fields.publishedAt.toISOString() : null,
    cover: fields.cover ? `${fields.cover.publicId}|${fields.cover.alt}` : "",
  };
  return Object.keys(before).filter((key) => before[key] !== after[key]);
}

export async function updateNewsPost(
  staff: StaffContext,
  id: string,
  input: NewsFormInput,
): Promise<StaffNewsDetail> {
  assertMayManage(staff);
  const post = await getNewsPostForStaff(id);
  const fields = await toFields(input, post);
  const changed = changedFields(post, fields);
  if (changed.length === 0) {
    return post;
  }
  if (!(await updateNewsRecord(id, post.status, fields))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(post.cover, fields.cover);
  await recordAudit(staff, {
    action: "news.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (post.status !== "DRAFT" || fields.status !== "DRAFT") {
    expirePublicPages();
  }
  return getNewsPostForStaff(id);
}

/** Deletes a post and its cover for good, after a confirmation. Recorded in the audit log. */
export async function deleteNewsPost(staff: StaffContext, id: string): Promise<void> {
  assertMayManage(staff);
  if (!hasPermission(staff, "content:delete")) {
    throw new AppError("FORBIDDEN", "You cannot delete news posts.");
  }
  const post = await getNewsPostForStaff(id);
  if (!(await deleteNewsRecord(id, post.status))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(post.cover, null);
  await recordAudit(staff, {
    action: "news.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: post.title, status: post.status },
  });
  if (post.status !== "DRAFT") {
    expirePublicPages();
  }
}
