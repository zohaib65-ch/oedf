import { statusLookupSchema } from "@/lib/validations/application";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { guardPublicRequest, LOOKUP_RATE_LIMIT } from "@/server/security/public-form-guard";
import { lookupApplicationStatus } from "@/server/services/application.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, statusLookupSchema);
  await guardPublicRequest(request, {
    scope: "status-lookup",
    ...LOOKUP_RATE_LIMIT,
    faxNumber: input.faxNumber,
  });
  return ok(await lookupApplicationStatus(input));
});
