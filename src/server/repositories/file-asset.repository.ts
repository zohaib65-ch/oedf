import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import type { FILE_PURPOSES } from "@/lib/constants/enums";
import type { UploadResourceType } from "@/lib/constants/uploads";
import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";

/** The kinds of record a file can belong to. The owner decides who may open the file. */
export const FILE_OWNER_TYPES = {
  application: "Application",
  jobApplication: "JobApplication",
} as const;

export interface NewFileAsset {
  id: string;
  publicId: string;
  resourceType: UploadResourceType;
  format: string;
  bytes: number;
  originalName: string;
  purpose: (typeof FILE_PURPOSES)[number];
  ownerType: (typeof FILE_OWNER_TYPES)[keyof typeof FILE_OWNER_TYPES];
  ownerId: string;
}

/** Saves the files of one record. Every file in this app is private. */
export async function createFileAssets(
  assets: readonly NewFileAsset[],
  session: ClientSession,
): Promise<void> {
  await FileAssetModel.insertMany(
    assets.map(({ id, ownerType, ownerId, ...asset }) => ({
      _id: id,
      ...asset,
      access: "PRIVATE" as const,
      owner: { type: ownerType, id: ownerId },
    })),
    { session },
  );
}

export interface FileAssetRecord {
  id: string;
  publicId: string;
  resourceType: UploadResourceType;
  format: string;
  ownerType: string;
  ownerId: string;
}

export async function findFileAssetById(id: string): Promise<FileAssetRecord | null> {
  await connectDb();
  const file = await FileAssetModel.findById(id, {
    publicId: 1,
    resourceType: 1,
    format: 1,
    owner: 1,
  }).lean();
  if (!file?.owner) {
    return null;
  }
  return {
    id: file._id.toString(),
    publicId: file.publicId,
    resourceType: file.resourceType === "raw" ? "raw" : "image",
    format: file.format,
    ownerType: file.owner.type,
    ownerId: file.owner.id.toString(),
  };
}

/** Which of these public IDs are saved in the database. The cleanup job never deletes those. */
export async function findSavedPublicIds(publicIds: readonly string[]): Promise<Set<string>> {
  await connectDb();
  const files = await FileAssetModel.find(
    { publicId: mongoose.trusted({ $in: publicIds }) },
    { publicId: 1 },
  ).lean();
  return new Set(files.map((file) => file.publicId));
}
