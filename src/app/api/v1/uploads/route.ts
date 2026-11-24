import { uploadRequestSchema } from "@/lib/validations/upload";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { guardPublicRequest, UPLOAD_RATE_LIMIT } from "@/server/security/public-form-guard";
import { createUploadPermission } from "@/server/services/upload.service";

// Uploads are rate-limited but have no spam check: the file itself is checked after the upload.
export const POST = withApiHandler(async (request) => {
  await guardPublicRequest(request, {
    scope: "upload",
    ...UPLOAD_RATE_LIMIT,
    needsTurnstile: false,
  });
  const input = await readJson(request, uploadRequestSchema);
  return ok(createUploadPermission(input));
});
