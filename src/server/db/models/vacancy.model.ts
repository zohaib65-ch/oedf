import "server-only";
import { Schema } from "mongoose";

import { EMPLOYMENT_TYPES, VACANCY_STATUSES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";

const vacancySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    city: { type: String, required: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    description: { type: String, required: true },
    requirements: { type: String, default: "" },
    deadline: { type: Date, required: true },
    status: { type: String, enum: VACANCY_STATUSES, default: "DRAFT" },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

vacancySchema.index({ status: 1, deadline: 1 });
vacancySchema.index({ departmentId: 1, status: 1 });
vacancySchema.index({ createdAt: -1 });

export const VacancyModel = defineModel("Vacancy", vacancySchema);
