import "server-only";
import { Schema } from "mongoose";

import { defineModel } from "@/server/db/define-model";

// `_id` is the counter name (for example ADM-2026). Reference numbers come from one atomic
// findOneAndUpdate with $inc and upsert, so they never repeat.
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const CounterModel = defineModel("Counter", counterSchema);
