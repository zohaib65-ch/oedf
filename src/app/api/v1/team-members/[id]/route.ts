import { teamMemberFormSchema } from "@/lib/validations/team";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { deleteTeamMember, updateTeamMember } from "@/server/services/team-management.service";

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/team-members/[id]">) => {
    const staff = await requireApiPermission(request, "team:manage");
    const { id } = await params;
    const input = await readJson(request, teamMemberFormSchema);
    return ok(await updateTeamMember(staff, id, input));
  },
);

// Deletes the team member and their photo; audit-logged.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/team-members/[id]">) => {
    const staff = await requireApiPermission(request, "team:manage");
    const { id } = await params;
    await deleteTeamMember(staff, id);
    return new Response(null, { status: 204 });
  },
);
