import { updateAssignmentSchema } from "@/lib/validations/directive";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { updateAssignment } from "@/server/services/directive.service";

// Choosing the owner needs `directives:respond`; starting or completing the work needs
// `directives:update`. The service checks each against the office the part belongs to.
export const PATCH = withApiHandler(
  async (
    request,
    { params }: RouteContext<"/api/v1/directives/[id]/assignments/[assignmentId]">,
  ) => {
    const staff = await requireApiPermission(request, "directives:read");
    const { id, assignmentId } = await params;
    const input = await readJson(request, updateAssignmentSchema);
    return ok(await updateAssignment(staff, id, assignmentId, input));
  },
);
