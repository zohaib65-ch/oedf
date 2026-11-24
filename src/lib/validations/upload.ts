import { z } from "zod";

import { MAX_UPLOAD_BYTES, PUBLIC_UPLOAD_PURPOSES } from "@/lib/constants/uploads";

/** What the browser sends to ask for permission to upload one file. */
export const uploadRequestSchema = z.object({
  purpose: z.enum(PUBLIC_UPLOAD_PURPOSES),
  fileName: z.string().trim().min(1).max(255),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES, "The file is larger than 5 MB"),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/** What the server answers: everything the browser needs to upload one file straight to Cloudinary. */
export interface UploadPermission {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  type: string;
  tags: string;
  allowedFormats: string;
  resourceType: "image" | "raw";
}
