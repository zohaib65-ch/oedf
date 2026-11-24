import "server-only";
import { Schema } from "mongoose";

import { FILE_ACCESS_LEVELS, FILE_PURPOSES } from "@/lib/constants/enums";
import { defineModel } from "@/server/db/define-model";

const RESOURCE_TYPES = ["image", "raw", "video"] as const;

const ownerSchema = new Schema(
  {
    type: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

// One document per confirmed Cloudinary upload. `owner` drives the permission check on file access.
const fileAssetSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },
    access: { type: String, enum: FILE_ACCESS_LEVELS, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true, min: 0 },
    originalName: { type: String, required: true },
    purpose: { type: String, enum: FILE_PURPOSES, required: true },
    owner: ownerSchema,
    uploadedById: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true, collection: "fileAssets" },
);

fileAssetSchema.index({ "owner.type": 1, "owner.id": 1 });

export const FileAssetModel = defineModel("FileAsset", fileAssetSchema);
