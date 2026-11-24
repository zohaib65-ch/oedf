import "server-only";

import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";

export interface NewAuditEntry {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, string>;
  ipAddress: string;
  userAgent: string;
}

export async function createAuditEntry(entry: NewAuditEntry): Promise<void> {
  await connectDb();
  await AuditLogModel.create(entry);
}
