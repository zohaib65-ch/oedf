import "server-only";
import { Schema } from "mongoose";

import { CONTENT_STATUSES, NEWS_TYPES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { imageSchema } from "@/server/db/models/shared.schema";

const seoSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const newsPostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: NEWS_TYPES, required: true },
    excerpt: { type: String, required: true },
    body: { type: String, required: true },
    eventDate: { type: Date },
    /** Optional, "HH:mm" in Pakistan time; the date alone means an all-day event. */
    eventStartTime: { type: String, default: "" },
    venue: { type: String, default: "" },
    status: { type: String, enum: CONTENT_STATUSES, default: "DRAFT" },
    publishedAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    authorName: { type: String, required: true },
    cover: imageSchema,
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true, collection: "newsPosts" },
);

newsPostSchema.index({ status: 1, type: 1, publishedAt: -1 });

export const NewsPostModel = defineModel("NewsPost", newsPostSchema);
