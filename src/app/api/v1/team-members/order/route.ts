import { teamOrderSchema } from "@/lib/validations/team";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { reorderTeam } from "@/server/services/team-management.service";

// `{ ids }`: every team member, first to last.
export const PATCH = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "team:manage");
  await reorderTeam(staff, await readJson(request, teamOrderSchema));
  return new Response(null, { status: 204 });
});
