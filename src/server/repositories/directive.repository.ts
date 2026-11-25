import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import { FINISHED_ASSIGNMENT_STATUSES } from "@/lib/constants/directive-workflow";
import {
  ASSIGNMENT_STATUSES,
  type CLARIFICATION_DECISIONS,
  type CLARIFICATION_REASONS,
  type DIRECTIVE_PRIORITIES,
} from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { DirectiveModel } from "@/server/db/models/directive.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";

type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
type DirectivePriority = (typeof DIRECTIVE_PRIORITIES)[number];
type ClarificationReason = (typeof CLARIFICATION_REASONS)[number];
type ClarificationDecision = (typeof CLARIFICATION_DECISIONS)[number];

const toDay = (date: Date) => date.toISOString().slice(0, 10);
/** A stored day (YYYY-MM-DD) is saved as UTC midnight, like every other date-only field. */
const fromDay = (day: string) => new Date(`${day}T00:00:00Z`);
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const STATUS_SET: ReadonlySet<string> = new Set(ASSIGNMENT_STATUSES);
/** History entries are typed loosely by the shared schema; the enum there keeps them valid. */
const asStatus = (value: string): AssignmentStatus =>
  STATUS_SET.has(value) ? (value as AssignmentStatus) : "PENDING_ACKNOWLEDGEMENT";

export interface Actor {
  id: string;
  name: string;
}

export interface DirectiveListItem {
  id: string;
  referenceNumber: string;
  title: string;
  priority: DirectivePriority;
  /** A day (YYYY-MM-DD). */
  dueDate: string;
  issuedAt: string;
  issuedByName: string;
  assignments: { id: string; departmentId: string; status: AssignmentStatus }[];
}

export interface DirectiveListOptions {
  q?: string | undefined;
  priority?: DirectivePriority | undefined;
  status?: AssignmentStatus | undefined;
  /** Only directives due before this day with work not finished. */
  overdueBefore?: string | undefined;
  /** Only directives for this office, and status filters apply to its assignment. Null: every office. */
  departmentId: string | null;
  sort: { field: "dueDate" | "issuedAt"; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}

interface AssignmentRow {
  _id: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  status: AssignmentStatus;
}

interface DirectiveRow {
  _id: mongoose.Types.ObjectId;
  referenceNumber: string;
  title: string;
  priority: DirectivePriority;
  dueDate: Date;
  issuedAt: Date;
  issuedByName: string;
  assignments: AssignmentRow[];
}

function toListItem(row: DirectiveRow): DirectiveListItem {
  return {
    id: row._id.toString(),
    referenceNumber: row.referenceNumber,
    title: row.title,
    priority: row.priority,
    dueDate: toDay(row.dueDate),
    issuedAt: row.issuedAt.toISOString(),
    issuedByName: row.issuedByName,
    assignments: row.assignments.map((assignment) => ({
      id: assignment._id.toString(),
      departmentId: assignment.departmentId.toString(),
      status: assignment.status,
    })),
  };
}

// Built only from validated values (enums, IDs, escaped text and days), never raw input.
function toFilter(options: DirectiveListOptions): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const office = options.departmentId ? { departmentId: toObjectId(options.departmentId) } : {};
  const conditions: Record<string, unknown>[] = [];
  if (options.departmentId) {
    conditions.push({ assignments: mongoose.trusted({ $elemMatch: office }) });
  }
  if (options.status) {
    conditions.push({
      assignments: mongoose.trusted({ $elemMatch: { ...office, status: options.status } }),
    });
  }
  if (options.overdueBefore) {
    filter.dueDate = mongoose.trusted({ $lt: fromDay(options.overdueBefore) });
    conditions.push({
      assignments: mongoose.trusted({
        $elemMatch: { ...office, status: mongoose.trusted({ $nin: FINISHED_ASSIGNMENT_STATUSES }) },
      }),
    });
  }
  if (options.priority) {
    filter.priority = options.priority;
  }
  if (options.q) {
    const pattern = new RegExp(escapeRegExp(options.q), "i");
    conditions.push({ $or: mongoose.trusted([{ title: pattern }, { referenceNumber: pattern }]) });
  }
  if (conditions.length > 0) {
    filter.$and = mongoose.trusted(conditions);
  }
  return filter;
}

const LIST_FIELDS = {
  referenceNumber: 1,
  title: 1,
  priority: 1,
  dueDate: 1,
  issuedAt: 1,
  issuedByName: 1,
  "assignments._id": 1,
  "assignments.departmentId": 1,
  "assignments.status": 1,
} as const;

export async function listDirectives(
  options: DirectiveListOptions,
): Promise<{ items: DirectiveListItem[]; total: number }> {
  await connectDb();
  const filter = toFilter(options);
  const direction = options.sort.direction === "asc" ? 1 : -1;
  const [rows, total] = await Promise.all([
    DirectiveModel.find(filter, LIST_FIELDS)
      .sort({ [options.sort.field]: direction, _id: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .lean<DirectiveRow[]>(),
    DirectiveModel.countDocuments(filter),
  ]);
  return { total, items: rows.map(toListItem) };
}

interface AssignmentHistoryEntry {
  from: AssignmentStatus | null;
  to: AssignmentStatus;
  reason: string;
  actorName: string;
  at: string;
}

export interface AssignmentDetail {
  id: string;
  departmentId: string;
  status: AssignmentStatus;
  ownerId: string | null;
  ownerName: string;
  acknowledgedAt: string | null;
  acknowledgedByName: string;
  completedAt: string | null;
  clarification: {
    reason: ClarificationReason;
    text: string;
    requestedByName: string;
    requestedAt: string;
    resolution: {
      decision: ClarificationDecision;
      note: string;
      resolvedByName: string;
      resolvedAt: string;
    } | null;
  } | null;
  history: AssignmentHistoryEntry[];
  updates: { id: string; authorName: string; body: string; createdAt: string }[];
}

export interface DirectiveDetail extends Omit<DirectiveListItem, "assignments"> {
  body: string;
  issuedById: string;
  assignments: AssignmentDetail[];
}

export async function findDirective(id: string): Promise<DirectiveDetail | null> {
  await connectDb();
  const directive = await DirectiveModel.findById(id).lean();
  if (!directive) {
    return null;
  }
  return {
    ...toListItem(directive),
    body: directive.body,
    issuedById: directive.issuedById.toString(),
    assignments: directive.assignments.map((assignment) => ({
      id: assignment._id.toString(),
      departmentId: assignment.departmentId.toString(),
      status: assignment.status,
      ownerId: assignment.ownerId ? assignment.ownerId.toString() : null,
      ownerName: assignment.ownerName,
      acknowledgedAt: assignment.acknowledgedAt ? assignment.acknowledgedAt.toISOString() : null,
      acknowledgedByName: assignment.acknowledgedByName,
      completedAt: assignment.completedAt ? assignment.completedAt.toISOString() : null,
      clarification: assignment.clarification
        ? {
            reason: assignment.clarification.reason,
            text: assignment.clarification.text,
            requestedByName: assignment.clarification.requestedByName,
            requestedAt: assignment.clarification.requestedAt.toISOString(),
            resolution: assignment.clarification.resolution
              ? {
                  decision: assignment.clarification.resolution.decision,
                  note: assignment.clarification.resolution.note,
                  resolvedByName: assignment.clarification.resolution.resolvedByName,
                  resolvedAt: assignment.clarification.resolution.resolvedAt.toISOString(),
                }
              : null,
          }
        : null,
      history: assignment.history.map((entry) => ({
        from: entry.from ? asStatus(entry.from) : null,
        to: asStatus(entry.to),
        reason: entry.reason,
        actorName: entry.actorName,
        at: entry.at.toISOString(),
      })),
      updates: assignment.updates.map((update) => ({
        id: update._id.toString(),
        authorName: update.authorName,
        body: update.body,
        createdAt: update.createdAt.toISOString(),
      })),
    })),
  };
}

export interface NewDirective {
  id: string;
  referenceNumber: string;
  title: string;
  body: string;
  priority: DirectivePriority;
  dueDate: string;
  departmentIds: string[];
  issuedBy: Actor;
}

export async function createDirective(input: NewDirective, session: ClientSession): Promise<void> {
  await DirectiveModel.insertMany(
    [
      {
        _id: toObjectId(input.id),
        referenceNumber: input.referenceNumber,
        title: input.title,
        body: input.body,
        priority: input.priority,
        dueDate: fromDay(input.dueDate),
        issuedById: toObjectId(input.issuedBy.id),
        issuedByName: input.issuedBy.name,
        assignments: input.departmentIds.map((departmentId) => ({
          departmentId: toObjectId(departmentId),
          history: [
            {
              to: "PENDING_ACKNOWLEDGEMENT",
              reason: "Directive issued",
              actorId: toObjectId(input.issuedBy.id),
              actorName: input.issuedBy.name,
            },
          ],
        })),
      },
    ],
    { session },
  );
}

/** Only the assignment with this ID, and only while it has one of these statuses. */
function assignmentIn(id: string, assignmentId: string, statuses: readonly AssignmentStatus[]) {
  return {
    _id: id,
    assignments: mongoose.trusted({
      $elemMatch: { _id: toObjectId(assignmentId), status: mongoose.trusted({ $in: statuses }) },
    }),
  };
}

const inAssignment = (fields: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [`assignments.$.${key}`, value]));

export interface AssignmentMove {
  from: AssignmentStatus;
  to: AssignmentStatus;
  reason: string;
  actor: Actor;
  /** Other assignment fields to set in the same write, such as `acknowledgedAt`. */
  set?: Record<string, unknown>;
}

/**
 * Moves one office's assignment to a new status and records who, when and why, but only while it
 * still has the status the caller saw. Returns false otherwise.
 */
export async function moveAssignment(
  id: string,
  assignmentId: string,
  move: AssignmentMove,
): Promise<boolean> {
  await connectDb();
  const result = await DirectiveModel.updateOne(assignmentIn(id, assignmentId, [move.from]), {
    $set: inAssignment({ ...move.set, status: move.to }),
    $push: {
      "assignments.$.history": {
        from: move.from,
        to: move.to,
        reason: move.reason,
        actorId: toObjectId(move.actor.id),
        actorName: move.actor.name,
        at: new Date(),
      },
    },
  });
  return result.matchedCount === 1;
}

/** Names the person who carries out the work, while the assignment is not finished. */
export async function setAssignmentOwner(
  id: string,
  assignmentId: string,
  owner: Actor,
  note: { author: Actor; body: string },
  openStatuses: readonly AssignmentStatus[],
): Promise<boolean> {
  await connectDb();
  const result = await DirectiveModel.updateOne(assignmentIn(id, assignmentId, openStatuses), {
    $set: inAssignment({ ownerId: toObjectId(owner.id), ownerName: owner.name }),
    $push: {
      "assignments.$.updates": {
        authorId: toObjectId(note.author.id),
        authorName: note.author.name,
        body: note.body,
      },
    },
  });
  return result.matchedCount === 1;
}

/** Adds a progress update to one office's assignment. */
export async function addAssignmentUpdate(
  id: string,
  assignmentId: string,
  note: { author: Actor; body: string },
): Promise<boolean> {
  await connectDb();
  const result = await DirectiveModel.updateOne(
    { _id: id, "assignments._id": toObjectId(assignmentId) },
    {
      $push: {
        "assignments.$.updates": {
          authorId: toObjectId(note.author.id),
          authorName: note.author.name,
          body: note.body,
        },
      },
    },
  );
  return result.matchedCount === 1;
}

/** The clarification fields, ready for `moveAssignment`'s `set`. */
export function clarificationFields(input: {
  reason: ClarificationReason;
  text: string;
  actor: Actor;
}): Record<string, unknown> {
  return {
    clarification: {
      reason: input.reason,
      text: input.text,
      requestedById: toObjectId(input.actor.id),
      requestedByName: input.actor.name,
      requestedAt: new Date(),
    },
  };
}

/** The resolution fields, ready for `moveAssignment`'s `set`. */
export function resolutionFields(input: {
  decision: ClarificationDecision;
  note: string;
  actor: Actor;
}): Record<string, unknown> {
  return {
    "clarification.resolution": {
      decision: input.decision,
      note: input.note,
      resolvedById: toObjectId(input.actor.id),
      resolvedByName: input.actor.name,
      resolvedAt: new Date(),
    },
  };
}

/** The acknowledgement fields, ready for `moveAssignment`'s `set`. */
export function acknowledgementFields(actor: Actor): Record<string, unknown> {
  return {
    acknowledgedAt: new Date(),
    acknowledgedById: toObjectId(actor.id),
    acknowledgedByName: actor.name,
  };
}
