import "server-only";
import { Schema } from "mongoose";

import { CONTENT_STATUSES, PROGRAM_CATEGORIES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { imageSchema } from "@/server/db/models/shared.schema";

const programSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, enum: PROGRAM_CATEGORIES, required: true },
    summary: { type: String, required: true },
    description: { type: String, default: "" },
    duration: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    status: { type: String, enum: CONTENT_STATUSES, default: "DRAFT" },
    acceptsApplications: { type: Boolean, default: false },
    institutionIds: [{ type: Schema.Types.ObjectId, ref: "Institution" }],
    image: imageSchema,
  },
  { timestamps: true },
);

programSchema.index({ status: 1, category: 1, title: 1 });
programSchema.index({ acceptsApplications: 1, status: 1 });

export const ProgramModel = defineModel("Program", programSchema);
