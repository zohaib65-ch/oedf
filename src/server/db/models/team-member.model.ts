import "server-only";
import { Schema } from "mongoose";

import { defineModel } from "@/server/db/define-model";
import { imageSchema } from "@/server/db/models/shared.schema";

/** A person on the public Team page. Super Admin manages the list and its order. */
const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    bio: { type: String, default: "" },
    image: imageSchema,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

teamMemberSchema.index({ isPublished: 1, order: 1 });

export const TeamMemberModel = defineModel("TeamMember", teamMemberSchema);
