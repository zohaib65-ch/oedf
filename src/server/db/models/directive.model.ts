import "server-only";
import { Schema } from "mongoose";

import {
  ASSIGNMENT_STATUSES,
  CLARIFICATION_DECISIONS,
  CLARIFICATION_REASONS,
  DIRECTIVE_PRIORITIES,
} from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { createStatusHistorySchema, noteSchema } from "@/server/db/models/shared.schema";

const resolutionSchema = new Schema(
  {
    decision: { type: String, enum: CLARIFICATION_DECISIONS, required: true },
    note: { type: String, default: "" },
    resolvedById: { type: Schema.Types.ObjectId, ref: "user", required: true },
    resolvedByName: { type: String, required: true },
    resolvedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const clarificationSchema = new Schema(
  {
    reason: { type: String, enum: CLARIFICATION_REASONS, required: true },
    text: { type: String, required: true },
    requestedById: { type: Schema.Types.ObjectId, ref: "user", required: true },
    requestedByName: { type: String, required: true },
    requestedAt: { type: Date, default: () => new Date() },
    resolution: resolutionSchema,
  },
  { _id: false },
);

// One assignment per target office, with its own acknowledgement, owner, status history and progress
// updates. The latest clarification is kept in `clarification`; every one is also in `history`.
const assignmentSchema = new Schema({
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  status: { type: String, enum: ASSIGNMENT_STATUSES, default: "PENDING_ACKNOWLEDGEMENT" },
  ownerId: { type: Schema.Types.ObjectId, ref: "user" },
  ownerName: { type: String, default: "" },
  acknowledgedAt: { type: Date },
  acknowledgedById: { type: Schema.Types.ObjectId, ref: "user" },
  acknowledgedByName: { type: String, default: "" },
  clarification: clarificationSchema,
  completedAt: { type: Date },
  history: { type: [createStatusHistorySchema(ASSIGNMENT_STATUSES)], default: [] },
  updates: { type: [noteSchema], default: [] },
});

const directiveSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: { type: String, enum: DIRECTIVE_PRIORITIES, default: "NORMAL" },
    dueDate: { type: Date, required: true },
    issuedById: { type: Schema.Types.ObjectId, ref: "user", required: true },
    issuedByName: { type: String, required: true },
    issuedAt: { type: Date, default: () => new Date() },
    assignments: { type: [assignmentSchema], default: [] },
  },
  { timestamps: true },
);

directiveSchema.index({ "assignments.departmentId": 1, "assignments.status": 1 });
directiveSchema.index({ dueDate: 1 });

export const DirectiveModel = defineModel("Directive", directiveSchema);
