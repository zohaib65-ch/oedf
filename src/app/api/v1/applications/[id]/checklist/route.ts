import { checklistSchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { updateChecklist } from "@/server/services/application-review.service";

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]/checklist">) => {
    const staff = await requireApiPermission(request, "applications:review");
    const { id } = await params;
    const input = await readJson(request, checklistSchema);
    return ok(await updateChecklist(staff, id, input));
  },
);
