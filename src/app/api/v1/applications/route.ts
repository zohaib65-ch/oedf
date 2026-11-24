import { applicationSchema } from "@/lib/validations/application";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { submitApplication } from "@/server/services/application.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, applicationSchema);
  await guardPublicRequest(request, {
    scope: "application",
    ...FORM_RATE_LIMIT,
    faxNumber: input.faxNumber,
    turnstileToken: input.turnstileToken,
  });
  return ok(await submitApplication(input), 201);
});
