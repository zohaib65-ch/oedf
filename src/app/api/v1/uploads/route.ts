import { STAFF_UPLOAD_PURPOSES } from "@/lib/constants/uploads";
import { uploadRequestSchema } from "@/lib/validations/upload";
import { requireApiSession } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { guardPublicRequest, UPLOAD_RATE_LIMIT } from "@/server/security/public-form-guard";
import { createUploadPermission } from "@/server/services/upload.service";

const STAFF_PURPOSES: ReadonlySet<string> = new Set(STAFF_UPLOAD_PURPOSES);

// Visitors' uploads are rate-limited, and the file itself is checked after the upload. Staff
// purposes (images, agreements) need a signed-in staff member; the record the file is saved to
// checks the permission.
export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, uploadRequestSchema);
  if (STAFF_PURPOSES.has(input.purpose)) {
    await requireApiSession(request);
  } else {
    await guardPublicRequest(request, {
      scope: "upload",
      ...UPLOAD_RATE_LIMIT,
    });
  }
  return ok(createUploadPermission(input));
});
