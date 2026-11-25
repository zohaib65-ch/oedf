import "server-only";

import mongoose from "mongoose";

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

/**
 * Whether the person has done any work in the portal. Their own account actions (signing in,
 * changing their password or profile) do not count; every other audited action does.
 */
export async function hasWorkHistory(actorId: string): Promise<boolean> {
  await connectDb();
  const entry = await AuditLogModel.exists({
    actorId: new mongoose.Types.ObjectId(actorId),
    action: mongoose.trusted({ $not: /^auth\./ }),
  });
  return entry !== null;
}
