import "server-only";
import { Schema } from "mongoose";

import { defineModel } from "@/server/db/define-model";

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "rateLimits" },
);

// A TTL index deletes old buckets automatically.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel = defineModel("RateLimit", rateLimitSchema);
