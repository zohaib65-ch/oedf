import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { getApplicationDetail } from "@/server/services/application-review.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]">) => {
    await requireApiPermission(request, "applications:read");
    const { id } = await params;
    return ok(await getApplicationDetail(id));
  },
);
