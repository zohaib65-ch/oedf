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

export interface AuditLogFilter {
  actorId?: string;
  entityType?: string;
  action?: string;
  from?: Date;
  /** Exclusive upper bound. */
  to?: Date;
}

export interface AuditLogRecord {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
  ipAddress: string;
  createdAt: string;
}

function toQuery(filter: AuditLogFilter) {
  const query: Record<string, unknown> = {};
  if (filter.actorId) {
    query.actorId = filter.actorId;
  }
  if (filter.entityType) {
    query.entityType = filter.entityType;
  }
  if (filter.action) {
    query.action = filter.action;
  }
  if (filter.from || filter.to) {
    // Built from validated dates only, so the operators are not request input.
    query.createdAt = mongoose.trusted({
      ...(filter.from ? { $gte: filter.from } : {}),
      ...(filter.to ? { $lt: filter.to } : {}),
    });
  }
  return query;
}

/** One page of the audit log, newest first. The user agent is not part of the list. */
export async function listAuditEntries(
  filter: AuditLogFilter,
  paging: { page: number; pageSize: number; direction: "asc" | "desc" },
): Promise<{ items: AuditLogRecord[]; total: number }> {
  await connectDb();
  const query = toQuery(filter);
  const [rows, total] = await Promise.all([
    AuditLogModel.find(query, { userAgent: 0 })
      .sort(paging.direction === "asc" ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 })
      .skip((paging.page - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);
  return {
    total,
    items: rows.map((row) => ({
      id: row._id.toString(),
      actorName: row.actorName,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: (row.metadata ?? {}) as Record<string, string>,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    })),
  };
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
