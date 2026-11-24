import "server-only";
import { Schema } from "mongoose";

import { CONTENT_STATUSES, PUBLICATION_TYPES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";
import { imageSchema } from "@/server/db/models/shared.schema";

const publicationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: PUBLICATION_TYPES, required: true },
    summary: { type: String, required: true },
    authors: { type: [String], default: [] },
    publishedOn: { type: Date },
    pdfFileId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: CONTENT_STATUSES, default: "DRAFT" },
    cover: imageSchema,
  },
  { timestamps: true },
);

publicationSchema.index({ title: "text", summary: "text" });
publicationSchema.index({ status: 1, type: 1, publishedOn: -1 });

export const PublicationModel = defineModel("Publication", publicationSchema);
