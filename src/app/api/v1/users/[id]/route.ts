import { updateUserSchema } from "@/lib/validations/user";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { deleteUser, updateUser } from "@/server/services/user.service";

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/users/[id]">) => {
    const staff = await requireApiPermission(request, "users:manage");
    const { id } = await params;
    const input = await readJson(request, updateUserSchema);
    return ok(await updateUser(staff, id, input));
  },
);

// Deletes an account with no work history; anyone who has worked in the portal is deactivated instead.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/users/[id]">) => {
    const staff = await requireApiPermission(request, "users:manage");
    const { id } = await params;
    await deleteUser(staff, id);
    return new Response(null, { status: 204 });
  },
);
