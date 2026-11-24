import { applicationStatusChangeSchema } from "@/lib/validations/application-review";
import { requireApiSession } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { changeStatus } from "@/server/services/application-review.service";

// The permission depends on the target status (review, or decide for Approved and Rejected), so
// the service checks it once it knows the move.
export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]/status">) => {
    const staff = await requireApiSession(request);
    const { id } = await params;
    const input = await readJson(request, applicationStatusChangeSchema);
    return ok(await changeStatus(staff, id, input));
  },
);
