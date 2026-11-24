import "server-only";
import { Schema } from "mongoose";

/** A public image stored in Cloudinary. MongoDB keeps only the public ID and display data. */
export const imageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    alt: { type: String, required: true },
  },
  { _id: false },
);

/** An internal note or progress update. The author's name is saved beside the ID so timelines need no lookups. */
export const noteSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  authorName: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

/** One status change: who, when and why. */
export function createStatusHistorySchema(statuses: readonly string[]) {
  return new Schema(
    {
      from: { type: String, enum: statuses },
      to: { type: String, enum: statuses, required: true },
      reason: { type: String, default: "" },
      actorId: { type: Schema.Types.ObjectId, ref: "user" },
      actorName: { type: String, default: "" },
      at: { type: Date, default: () => new Date() },
    },
    { _id: false },
  );
}
