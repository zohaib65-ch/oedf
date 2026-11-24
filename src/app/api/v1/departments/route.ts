import { requireApiSession } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { getDepartmentsForStaff } from "@/server/services/settings.service";

// Any signed-in staff member may list the offices, for selects and filters.
export const GET = withApiHandler(async (request) => {
  await requireApiSession(request);
  return ok(await getDepartmentsForStaff());
});
