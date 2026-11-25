import { publicationFormSchema } from "@/lib/validations/publication";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deletePublication,
  getPublicationForStaff,
  updatePublication,
} from "@/server/services/publication-management.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/publications/[id]">) => {
    await requireApiPermission(request, "publications:read");
    const { id } = await params;
    return ok(await getPublicationForStaff(id));
  },
);

// The form sends every field. Publishing or changing a published publication also needs
// `publications:publish`, which the service checks once it knows the status.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/publications/[id]">) => {
    const staff = await requireApiPermission(request, "publications:write");
    const { id } = await params;
    const input = await readJson(request, publicationFormSchema);
    return ok(await updatePublication(staff, id, input));
  },
);

// A Director deletes after confirming; the service also requires `content:delete`.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/publications/[id]">) => {
    const staff = await requireApiPermission(request, "publications:publish");
    const { id } = await params;
    await deletePublication(staff, id);
    return new Response(null, { status: 204 });
  },
);
