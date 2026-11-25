import { clarificationRequestSchema } from "@/lib/validations/directive";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { requestClarification } from "@/server/services/directive.service";

// The target office's Director asks the CEO Office to clarify. The CEO Office is emailed.
export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/directives/[id]/clarification">) => {
    const staff = await requireApiPermission(request, "directives:respond");
    const { id } = await params;
    const input = await readJson(request, clarificationRequestSchema);
    return ok(await requestClarification(staff, id, input));
  },
);
