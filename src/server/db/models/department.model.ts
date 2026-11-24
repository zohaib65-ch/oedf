import "server-only";
import { Schema } from "mongoose";

import { DEPARTMENT_CODES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";

const departmentSchema = new Schema(
  {
    code: { type: String, enum: DEPARTMENT_CODES, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    directorName: { type: String, default: "" },
    notificationEmail: { type: String, default: "" },
    order: { type: Number, required: true },
  },
  { timestamps: true },
);

export const DepartmentModel = defineModel("Department", departmentSchema);
