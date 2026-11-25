import { agreementFormSchema } from "@/lib/validations/institution";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { addAgreement } from "@/server/services/institution-management.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/institutions/[id]/agreements">) => {
    const staff = await requireApiPermission(request, "institutions:write");
    const { id } = await params;
    const input = await readJson(request, agreementFormSchema);
    return ok(await addAgreement(staff, id, input), 201);
  },
);
