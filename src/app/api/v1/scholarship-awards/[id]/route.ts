import { awardFormSchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { getAward, saveAward } from "@/server/services/scholarship-award.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/scholarship-awards/[id]">) => {
    await requireApiPermission(request, "awards:read");
    const { id } = await params;
    return ok(await getAward(id));
  },
);

// The edit form sends every field, so one schema checks the form and this update.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/scholarship-awards/[id]">) => {
    const staff = await requireApiPermission(request, "awards:manage");
    const { id } = await params;
    const input = await readJson(request, awardFormSchema);
    return ok(await saveAward(staff, id, input));
  },
);
