import { institutionFormSchema } from "@/lib/validations/institution";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deleteInstitution,
  getInstitutionForStaff,
  updateInstitution,
} from "@/server/services/institution-management.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/institutions/[id]">) => {
    await requireApiPermission(request, "institutions:read");
    const { id } = await params;
    return ok(await getInstitutionForStaff(id));
  },
);

// The form sends every field. A public institution, or making one public, also needs
// `institutions:publish`, which the service checks.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/institutions/[id]">) => {
    const staff = await requireApiPermission(request, "institutions:write");
    const { id } = await params;
    const input = await readJson(request, institutionFormSchema);
    return ok(await updateInstitution(staff, id, input));
  },
);

// Deleting also needs `content:delete` (and `institutions:publish` for a public one), checked in
// the service. Only an institution without agreements or reviews can go; it is audit-logged.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/institutions/[id]">) => {
    const staff = await requireApiPermission(request, "institutions:write");
    const { id } = await params;
    await deleteInstitution(staff, id);
    return new Response(null, { status: 204 });
  },
);
