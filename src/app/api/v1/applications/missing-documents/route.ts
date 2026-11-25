import { missingDocumentsSchema } from "@/lib/validations/application";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { submitMissingDocuments } from "@/server/services/application.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, missingDocumentsSchema);
  await guardPublicRequest(request, {
    scope: "missing-documents",
    ...FORM_RATE_LIMIT,
    faxNumber: input.faxNumber,
  });
  return ok(await submitMissingDocuments(input));
});
