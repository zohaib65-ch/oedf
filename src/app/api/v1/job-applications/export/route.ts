import { listJobApplicationsQuerySchema } from "@/lib/validations/job-application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { csvResponse } from "@/server/lib/csv";
import { exportJobApplications } from "@/server/services/export.service";

// The list's filters, search and sort, as a CSV download. Audit-logged.
export const GET = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "job-applications:export");
  const query = listJobApplicationsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { fileName, csv } = await exportJobApplications(staff, query);
  return csvResponse(fileName, csv);
});
