import { listApplicationsQuerySchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { csvResponse } from "@/server/lib/csv";
import { exportApplications } from "@/server/services/export.service";

// The list's filters, search and sort, as a CSV download. Audit-logged.
export const GET = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "applications:export");
  const query = listApplicationsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { fileName, csv } = await exportApplications(staff, query);
  return csvResponse(fileName, csv);
});
