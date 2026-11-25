import { clarificationResolutionSchema } from "@/lib/validations/directive";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { resolveClarification } from "@/server/services/directive.service";

// The CEO Office reopens the office's part or closes it.
export const POST = withApiHandler(
  async (
    request,
    { params }: RouteContext<"/api/v1/directives/[id]/assignments/[assignmentId]/resolve">,
  ) => {
    const staff = await requireApiPermission(request, "directives:resolve");
    const { id, assignmentId } = await params;
    const input = await readJson(request, clarificationResolutionSchema);
    return ok(await resolveClarification(staff, id, assignmentId, input));
  },
);
