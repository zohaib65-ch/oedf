import { jobApplicationSchema } from "@/lib/validations/job-application";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { submitJobApplication } from "@/server/services/job-application.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, jobApplicationSchema);
  await guardPublicRequest(request, {
    scope: "job-application",
    ...FORM_RATE_LIMIT,
    faxNumber: input.faxNumber,
    turnstileToken: input.turnstileToken,
  });
  return ok(await submitJobApplication(input), 201);
});
