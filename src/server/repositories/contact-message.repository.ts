import "server-only";
import mongoose from "mongoose";

import type { MESSAGE_STATUSES, MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";

export interface NewContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: (typeof MESSAGE_SUBJECTS)[number];
  message: string;
  departmentId: string;
}

export async function createContactMessage(data: NewContactMessage): Promise<void> {
  await connectDb();
  await ContactMessageModel.create(data);
}

type MessageStatus = (typeof MESSAGE_STATUSES)[number];
type MessageSubject = (typeof MESSAGE_SUBJECTS)[number];

export interface MessageListItem {
  id: string;
  name: string;
  email: string;
  subject: MessageSubject;
  status: MessageStatus;
  departmentId: string;
  createdAt: string;
}

export interface MessageDetail extends MessageListItem {
  phone: string;
  message: string;
  updatedAt: string;
}

export interface MessageListOptions {
  /** One office's inbox, or every office's when null. */
  departmentId: string | null;
  q?: string | undefined;
  status?: MessageStatus | undefined;
  subject?: MessageSubject | undefined;
  sort: { field: "createdAt" | "name"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

interface MessageRow {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  subject: MessageSubject;
  status: MessageStatus;
  message: string;
  departmentId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function toListItem(row: MessageRow): MessageListItem {
  return {
    id: row._id.toString(),
    name: row.name,
    email: row.email,
    subject: row.subject,
    status: row.status,
    departmentId: row.departmentId.toString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMessages(
  options: MessageListOptions,
): Promise<{ items: MessageListItem[]; total: number }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (options.departmentId) {
    filter.departmentId = new mongoose.Types.ObjectId(options.departmentId);
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.subject) {
    filter.subject = options.subject;
  }
  if (options.q) {
    const pattern = new RegExp(escapeRegExp(options.q), "i");
    filter.$or = mongoose.trusted([{ name: pattern }, { email: pattern }]);
  }
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    ContactMessageModel.find(filter, { message: 0, phone: 0 })
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean<MessageRow[]>(),
    ContactMessageModel.countDocuments(filter),
  ]);
  return { total, items: rows.map(toListItem) };
}

export async function findMessage(id: string): Promise<MessageDetail | null> {
  await connectDb();
  const row = await ContactMessageModel.findById(id).lean<MessageRow>();
  return row
    ? {
        ...toListItem(row),
        phone: row.phone,
        message: row.message,
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
}

/** Changes the status while it is still the one the caller saw. Returns false otherwise. */
export async function updateMessageStatus(
  id: string,
  expectedStatus: MessageStatus,
  status: MessageStatus,
): Promise<boolean> {
  await connectDb();
  const result = await ContactMessageModel.updateOne(
    { _id: id, status: expectedStatus },
    { $set: { status } },
  );
  return result.matchedCount === 1;
}
