import { contactMessageSchema } from "@/lib/validations/contact";
import { listMessagesQuerySchema } from "@/lib/validations/message";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { submitContactMessage } from "@/server/services/contact-message.service";
import { getMessages } from "@/server/services/message-inbox.service";

export const POST = withApiHandler(async (request) => {
  const input = await readJson(request, contactMessageSchema);
  await guardPublicRequest(request, {
    scope: "contact",
    ...FORM_RATE_LIMIT,
    faxNumber: input.faxNumber,
  });
  await submitContactMessage(input);
  return ok({ sent: true }, 201);
});

// The inbox: every office's messages for Super Admin and the CEO Office, otherwise the person's own
// office's subjects.
export const GET = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "messages:read");
  const query = listMessagesQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getMessages(staff, query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});
