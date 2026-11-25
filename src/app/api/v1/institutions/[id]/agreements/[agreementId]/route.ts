import { agreementFormSchema } from "@/lib/validations/institution";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { updateAgreement } from "@/server/services/institution-management.service";

// The form sends every field; an unchanged signed copy keeps its file.
export const PATCH = withApiHandler(
  async (
    request,
    { params }: RouteContext<"/api/v1/institutions/[id]/agreements/[agreementId]">,
  ) => {
    const staff = await requireApiPermission(request, "institutions:write");
    const { id, agreementId } = await params;
    const input = await readJson(request, agreementFormSchema);
    return ok(await updateAgreement(staff, id, agreementId, input));
  },
);
