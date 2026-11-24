import "server-only";

import type { AuditLogQuery } from "@/lib/validations/audit-log";
import type { StaffContext } from "@/server/auth/api-session";
import {
  createAuditEntry,
  listAuditEntries,
  type AuditLogRecord,
} from "@/server/repositories/audit-log.repository";

interface AuditEvent {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, string>;
}

/** Writes who did what, to which record, from where. Every write and sensitive read calls this. */
export async function recordAudit(staff: StaffContext, event: AuditEvent): Promise<void> {
  await createAuditEntry({
    actorId: staff.id,
    actorName: staff.name,
    ipAddress: staff.ipAddress,
    userAgent: staff.userAgent,
    ...event,
  });
}

const DAY_MS = 86_400_000;

export async function getAuditLog(
  query: AuditLogQuery,
): Promise<{ items: AuditLogRecord[]; total: number }> {
  return listAuditEntries(
    {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.from ? { from: new Date(`${query.from}T00:00:00+05:00`) } : {}),
      // The chosen end day is included, so the bound is the start of the next day.
      ...(query.to
        ? { to: new Date(new Date(`${query.to}T00:00:00+05:00`).getTime() + DAY_MS) }
        : {}),
    },
    { page: query.page, pageSize: query.pageSize },
  );
}
