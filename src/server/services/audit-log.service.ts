import "server-only";

import type { StaffContext } from "@/server/auth/api-session";
import { createAuditEntry } from "@/server/repositories/audit-log.repository";

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
