import "server-only";
import { Schema } from "mongoose";

import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  DOCUMENT_KINDS,
  GENDERS,
} from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { createStatusHistorySchema, noteSchema } from "@/server/db/models/shared.schema";

// CNIC numbers and financial details are sensitive: list queries exclude them with projections.
const applicantSchema = new Schema(
  {
    fullName: { type: String, required: true },
    guardianName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    cnic: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  { _id: false },
);

const educationSchema = new Schema(
  {
    lastInstitution: { type: String, required: true },
    classOrDegree: { type: String, required: true },
    boardOrUniversity: { type: String, required: true },
    marksOrPercentage: { type: String, required: true },
    passingYear: { type: Number, required: true },
  },
  { _id: false },
);

const financialSchema = new Schema(
  {
    monthlyIncomePkr: { type: Number, required: true, min: 0 },
    familySize: { type: Number, required: true, min: 1 },
    guardianOccupation: { type: String, required: true },
    otherSupport: { type: String, default: "" },
    statementOfNeed: { type: String, required: true },
  },
  { _id: false },
);

const documentSchema = new Schema({
  kind: { type: String, enum: DOCUMENT_KINDS, required: true },
  fileId: { type: Schema.Types.ObjectId, ref: "FileAsset", required: true },
});

const checklistSchema = new Schema(
  {
    identity: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
    eligibility: { type: Boolean, default: false },
    documents: { type: Boolean, default: false },
  },
  { _id: false },
);

const decisionSchema = new Schema(
  {
    reason: { type: String, default: "" },
    decidedById: { type: Schema.Types.ObjectId, ref: "user", required: true },
    decidedByName: { type: String, required: true },
    decidedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: APPLICATION_TYPES, required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "SUBMITTED" },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    intakeSession: { type: String, default: "" },
    applicant: { type: applicantSchema, required: true },
    education: { type: educationSchema, required: true },
    financial: financialSchema,
    documents: { type: [documentSchema], default: [] },
    checklist: { type: checklistSchema, default: () => ({}) },
    missingItems: { type: [String], default: [] },
    decision: decisionSchema,
    notes: { type: [noteSchema], default: [] },
    statusHistory: { type: [createStatusHistorySchema(APPLICATION_STATUSES)], default: [] },
  },
  { timestamps: true },
);

applicationSchema.index({ status: 1, type: 1, createdAt: -1 });
applicationSchema.index({ "applicant.email": 1 });
applicationSchema.index({ "applicant.cnic": 1 });
applicationSchema.index({ "applicant.fullName": "text", referenceNumber: "text" });

export const ApplicationModel = defineModel("Application", applicationSchema);
