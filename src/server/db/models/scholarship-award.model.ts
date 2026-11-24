import "server-only";
import { Schema } from "mongoose";

import { AWARD_PERIODS, AWARD_STATUSES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { noteSchema } from "@/server/db/models/shared.schema";

// Awards are records only. The system never processes payments.
const scholarshipAwardSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    // Saved with the award so lists need no lookup of the application.
    referenceNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    amountPkr: { type: Number, required: true, min: 0, validate: Number.isInteger },
    period: { type: String, enum: AWARD_PERIODS, required: true },
    startDate: { type: Date, required: true },
    renewalDate: { type: Date },
    status: { type: String, enum: AWARD_STATUSES, default: "ACTIVE" },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true, collection: "scholarshipAwards" },
);

scholarshipAwardSchema.index({ renewalDate: 1, status: 1 });
scholarshipAwardSchema.index({ status: 1, startDate: -1 });

export const ScholarshipAwardModel = defineModel("ScholarshipAward", scholarshipAwardSchema);
