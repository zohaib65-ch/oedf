import { applicationSchema } from "@/lib/validations/application";
import { listApplicationsQuerySchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { getApplications } from "@/server/services/application-review.service";
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

// Staff list with filters, search and sorting. Only the last four CNIC digits are returned.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "applications:read");
  const query = listApplicationsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getApplications(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});
