import { programFormSchema } from "@/lib/validations/program";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deleteProgram,
  getProgramForStaff,
  updateProgram,
} from "@/server/services/program-management.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/programs/[id]">) => {
    await requireApiPermission(request, "programs:read");
    const { id } = await params;
    return ok(await getProgramForStaff(id));
  },
);

// The form sends every field. Publishing or changing a published program also needs
// `programs:publish`, which the service checks once it knows the status.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/programs/[id]">) => {
    const staff = await requireApiPermission(request, "programs:write");
    const { id } = await params;
    const input = await readJson(request, programFormSchema);
    return ok(await updateProgram(staff, id, input));
  },
);

// Only a program nobody applied to can be deleted; one with applications is archived instead.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/programs/[id]">) => {
    const staff = await requireApiPermission(request, "programs:write");
    const { id } = await params;
    await deleteProgram(staff, id);
    return new Response(null, { status: 204 });
  },
);
