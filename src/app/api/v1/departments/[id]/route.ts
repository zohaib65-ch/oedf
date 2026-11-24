import { updateDepartmentSchema } from "@/lib/validations/settings";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { updateDepartment } from "@/server/services/settings.service";

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/departments/[id]">) => {
    const staff = await requireApiPermission(request, "settings:manage");
    const { id } = await params;
    const input = await readJson(request, updateDepartmentSchema);
    return ok(await updateDepartment(staff, id, input));
  },
);
