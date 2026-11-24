import "server-only";
import { Schema } from "mongoose";

import { defineModel } from "@/server/db/define-model";

const faqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

faqSchema.index({ isPublished: 1, category: 1, order: 1 });

export const FaqModel = defineModel("Faq", faqSchema);
