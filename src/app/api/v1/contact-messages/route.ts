import { contactMessageSchema } from "@/lib/validations/contact";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { submitContactMessage } from "@/server/services/contact-message.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, contactMessageSchema);
  await guardPublicRequest(request, {
    scope: "contact",
    ...FORM_RATE_LIMIT,
    faxNumber: input.faxNumber,
    turnstileToken: input.turnstileToken,
  });
  await submitContactMessage(input);
  return ok({ sent: true }, 201);
});
