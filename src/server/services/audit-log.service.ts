import "server-only";

import type { AuditLogQuery } from "@/lib/validations/audit-log";
import { parseSort } from "@/lib/validations/common";
import type { StaffContext } from "@/server/auth/api-session";
import { toDayRange } from "@/server/lib/day-range";
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

export async function getAuditLog(
  query: AuditLogQuery,
): Promise<{ items: AuditLogRecord[]; total: number }> {
  return listAuditEntries(
    {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...toDayRange(query.from, query.to),
    },
    { page: query.page, pageSize: query.pageSize, direction: parseSort(query.sort).direction },
  );
}
