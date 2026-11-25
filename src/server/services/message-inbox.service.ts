import "server-only";

import { parseSort } from "@/lib/validations/common";
import type { ListMessagesQuery, MessageUpdateInput } from "@/lib/validations/message";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  findMessage,
  listMessages,
  updateMessageStatus,
  type MessageDetail,
  type MessageListItem,
} from "@/server/repositories/contact-message.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const ENTITY_TYPE = "ContactMessage";
const NOT_FOUND_MESSAGE = "This message could not be found.";
/** Roles that read every office's messages. Everyone else reads their own office's subjects. */
const ALL_OFFICES_ROLES: ReadonlySet<string> = new Set(["SUPER_ADMIN", "CEO_OFFICE"]);

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

/** The office whose inbox this person reads, or null for every office. */
function inboxScope(staff: StaffContext): { departmentId: string | null } | null {
  if (ALL_OFFICES_ROLES.has(staff.role)) {
    return { departmentId: null };
  }
  // Someone without an office would otherwise see every office's messages.
  return staff.departmentId ? { departmentId: staff.departmentId } : null;
}

export async function getMessages(
  staff: StaffContext,
  query: ListMessagesQuery,
): Promise<{ items: MessageListItem[]; total: number }> {
  const scope = inboxScope(staff);
  if (!scope) {
    return { items: [], total: 0 };
  }
  return listMessages({
    departmentId: scope.departmentId,
    q: query.q,
    status: query.status,
    subject: query.subject,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

/** One message, if it is in this person's inbox. Others get "not found", so nothing leaks. */
export async function getMessage(staff: StaffContext, id: string): Promise<MessageDetail> {
  const scope = inboxScope(staff);
  const message = isObjectId(id) ? await findMessage(id) : null;
  if (
    !scope ||
    !message ||
    (scope.departmentId !== null && message.departmentId !== scope.departmentId)
  ) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  return message;
}

/** New, Read, Replied or Archived, in any order. Every change is in the audit log. */
export async function changeMessageStatus(
  staff: StaffContext,
  id: string,
  input: MessageUpdateInput,
): Promise<MessageDetail> {
  const message = await getMessage(staff, id);
  if (message.status === input.status) {
    return message;
  }
  if (!(await updateMessageStatus(id, message.status, input.status))) {
    throw new AppError(
      "CONFLICT",
      "This message was changed by someone else. Reload the page and try again.",
    );
  }
  await recordAudit(staff, {
    action: "message.status_changed",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { from: message.status, to: input.status },
  });
  return getMessage(staff, id);
}
