import "server-only";
import { Schema } from "mongoose";

import { MESSAGE_STATUSES, MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";

// Messages are routed to an office by subject, so departmentId is set when the message is saved.
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    subject: { type: String, enum: MESSAGE_SUBJECTS, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: MESSAGE_STATUSES, default: "NEW" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  },
  { timestamps: true, collection: "contactMessages" },
);

contactMessageSchema.index({ departmentId: 1, status: 1, createdAt: -1 });

export const ContactMessageModel = defineModel("ContactMessage", contactMessageSchema);
