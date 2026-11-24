import "server-only";
import { Schema } from "mongoose";

import { AGREEMENT_STATUSES, INSTITUTION_STATUSES, INSTITUTION_TYPES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { imageSchema } from "@/server/db/models/shared.schema";

const agreementSchema = new Schema({
  partner: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  renewalDate: { type: Date },
  status: { type: String, enum: AGREEMENT_STATUSES, default: "DRAFT" },
  documentFileId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
});

const reviewSchema = new Schema({
  date: { type: Date, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  summary: { type: String, required: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  reviewerName: { type: String, required: true },
});

const institutionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: INSTITUTION_TYPES, required: true },
    city: { type: String, required: true },
    address: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: INSTITUTION_STATUSES, default: "PROPOSED" },
    isPublic: { type: Boolean, default: false },
    image: imageSchema,
    agreements: { type: [agreementSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true },
);

// The public site shows only Active institutions marked public.
institutionSchema.index({ status: 1, isPublic: 1, city: 1, type: 1 });
institutionSchema.index({ "agreements.renewalDate": 1 });

export const InstitutionModel = defineModel("Institution", institutionSchema);
