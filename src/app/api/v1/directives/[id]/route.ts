import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { getDirective } from "@/server/services/directive.service";

// A directive the caller may see, with every office's part, history and updates.
export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/directives/[id]">) => {
    const staff = await requireApiPermission(request, "directives:read");
    const { id } = await params;
    return ok(await getDirective(staff, id));
  },
);
