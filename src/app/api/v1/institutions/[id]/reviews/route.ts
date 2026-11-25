import { reviewFormSchema } from "@/lib/validations/institution";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { addReview } from "@/server/services/institution-management.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/institutions/[id]/reviews">) => {
    const staff = await requireApiPermission(request, "institutions:write");
    const { id } = await params;
    const input = await readJson(request, reviewFormSchema);
    return ok(await addReview(staff, id, input), 201);
  },
);
