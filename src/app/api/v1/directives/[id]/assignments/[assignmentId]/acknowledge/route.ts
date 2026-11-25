import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { acknowledgeAssignment } from "@/server/services/directive.service";

// The target office's Director confirms receipt.
export const POST = withApiHandler(
  async (
    request,
    { params }: RouteContext<"/api/v1/directives/[id]/assignments/[assignmentId]/acknowledge">,
  ) => {
    const staff = await requireApiPermission(request, "directives:respond");
    const { id, assignmentId } = await params;
    return ok(await acknowledgeAssignment(staff, id, assignmentId));
  },
);
