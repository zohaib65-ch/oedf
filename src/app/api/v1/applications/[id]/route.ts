import { applicationUpdateSchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deleteApplication,
  getApplicationDetail,
  updateApplication,
} from "@/server/services/application-review.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]">) => {
    await requireApiPermission(request, "applications:read");
    const { id } = await params;
    return ok(await getApplicationDetail(id));
  },
);

// `{ isArchived }`: archives the application, or restores it.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]">) => {
    const staff = await requireApiPermission(request, "applications:review");
    const { id } = await params;
    const input = await readJson(request, applicationUpdateSchema);
    return ok(await updateApplication(staff, id, input));
  },
);

// Deletes the application and its documents. Also needs `content:delete` (checked in the service);
// one with a scholarship award cannot be deleted. Audit-logged.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]">) => {
    const staff = await requireApiPermission(request, "applications:decide");
    const { id } = await params;
    await deleteApplication(staff, id);
    return new Response(null, { status: 204 });
  },
);
