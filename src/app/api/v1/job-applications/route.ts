import { jobApplicationSchema } from "@/lib/validations/job-application";
import { listJobApplicationsQuerySchema } from "@/lib/validations/job-application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";
import { getJobApplications } from "@/server/services/job-application-review.service";
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

// Staff list, filtered by vacancy and status. Only the last four CNIC digits are returned.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "job-applications:read");
  const query = listJobApplicationsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getJobApplications(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});
