import "server-only";
import { Schema } from "mongoose";

import { JOB_APPLICATION_STATUSES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { createStatusHistorySchema, noteSchema } from "@/server/db/models/shared.schema";

const candidateSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    cnic: { type: String, required: true },
    city: { type: String, required: true },
    highestQualification: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    coverLetter: { type: String, default: "" },
  },
  { _id: false },
);

const jobApplicationSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    vacancyId: { type: Schema.Types.ObjectId, ref: "Vacancy", required: true },
    status: { type: String, enum: JOB_APPLICATION_STATUSES, default: "RECEIVED" },
    cvFileId: { type: Schema.Types.ObjectId, ref: "FileAsset", required: true },
    interviewAt: { type: Date },
    archivedAt: { type: Date },
    candidate: { type: candidateSchema, required: true },
    notes: { type: [noteSchema], default: [] },
    statusHistory: { type: [createStatusHistorySchema(JOB_APPLICATION_STATUSES)], default: [] },
  },
  { timestamps: true, collection: "jobApplications" },
);

jobApplicationSchema.index({ vacancyId: 1, status: 1 });
jobApplicationSchema.index({ createdAt: -1 });
jobApplicationSchema.index({ "candidate.cnic": 1 });

export const JobApplicationModel = defineModel("JobApplication", jobApplicationSchema);
