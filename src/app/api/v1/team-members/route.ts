import { teamMemberFormSchema } from "@/lib/validations/team";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  createTeamMember,
  getTeamMembersForStaff,
} from "@/server/services/team-management.service";

// Every team member, published or not, in order. Only a Super Admin manages the team.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "team:manage");
  return ok(await getTeamMembersForStaff());
});

export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "team:manage");
  const input = await readJson(request, teamMemberFormSchema);
  return ok(await createTeamMember(staff, input), 201);
});
