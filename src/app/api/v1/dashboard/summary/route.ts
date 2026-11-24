import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export const GET = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "dashboard:read");
  return ok(await getDashboardSummary(staff));
});
