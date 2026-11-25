import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import type { FaqFormInput, FaqOrderInput } from "@/lib/validations/faq";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  createFaq as createFaqRecord,
  deleteFaq as deleteFaqRecord,
  findFaqForStaff,
  listFaqIdsInCategory,
  listFaqsForStaff,
  saveFaqOrder,
  updateFaq as updateFaqRecord,
  type StaffFaqRecord,
} from "@/server/repositories/faq.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const ENTITY_TYPE = "Faq";
const NOT_FOUND_MESSAGE = "This question could not be found.";
// Route handlers cannot use `updateTag`, so the public page is expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function assertMayManage(staff: StaffContext): void {
  if (!hasPermission(staff, "faqs:manage")) {
    throw new AppError("FORBIDDEN", "Only the CEO Office manages FAQs.");
  }
}

function expirePublicPage(): void {
  revalidateTag(CACHE_TAGS.faqs, EXPIRE_NOW);
}

export function getFaqsForStaff(): Promise<StaffFaqRecord[]> {
  return listFaqsForStaff();
}

async function getFaq(id: string): Promise<StaffFaqRecord> {
  const faq = isObjectId(id) ? await findFaqForStaff(id) : null;
  if (!faq) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  return faq;
}

/** Adds a question at the end of its topic. */
export async function createFaq(staff: StaffContext, input: FaqFormInput): Promise<StaffFaqRecord> {
  assertMayManage(staff);
  const id = await createFaqRecord(input);
  await recordAudit(staff, {
    action: "faq.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { question: input.question },
  });
  if (input.isPublished) {
    expirePublicPage();
  }
  return getFaq(id);
}

export async function updateFaq(
  staff: StaffContext,
  id: string,
  input: FaqFormInput,
): Promise<StaffFaqRecord> {
  assertMayManage(staff);
  const faq = await getFaq(id);
  const changed = (["question", "answer", "category", "isPublished"] as const).filter(
    (key) => faq[key] !== input[key],
  );
  if (changed.length === 0) {
    return faq;
  }
  if (!(await updateFaqRecord(id, input, faq.category !== input.category))) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  await recordAudit(staff, {
    action: "faq.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (faq.isPublished || input.isPublished) {
    expirePublicPage();
  }
  return getFaq(id);
}

/** Deletes a question after a confirmation. Needs `content:delete`; recorded in the audit log. */
export async function deleteFaq(staff: StaffContext, id: string): Promise<void> {
  assertMayManage(staff);
  if (!hasPermission(staff, "content:delete")) {
    throw new AppError("FORBIDDEN", "You cannot delete questions.");
  }
  const faq = await getFaq(id);
  if (!(await deleteFaqRecord(id))) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  await recordAudit(staff, {
    action: "faq.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { question: faq.question },
  });
  if (faq.isPublished) {
    expirePublicPage();
  }
}

/** Saves a topic's new order. The list must name every question in the topic exactly once. */
export async function reorderFaqs(staff: StaffContext, input: FaqOrderInput): Promise<void> {
  assertMayManage(staff);
  const current = await listFaqIdsInCategory(input.category);
  const given = new Set(input.ids);
  if (
    given.size !== input.ids.length ||
    given.size !== current.length ||
    current.some((id) => !given.has(id))
  ) {
    throw new AppError(
      "CONFLICT",
      "The questions in this topic changed. Reload the page and try again.",
    );
  }
  await saveFaqOrder(input.category, input.ids);
  await recordAudit(staff, {
    action: "faq.reordered",
    entityType: ENTITY_TYPE,
    entityId: input.ids[0] ?? "",
    metadata: { category: input.category },
  });
  expirePublicPage();
}
