import { vacancyStatusChangeSchema } from "@/lib/validations/vacancy";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { changeVacancyStatus } from "@/server/services/vacancy-management.service";

// Publish, close or reopen. Only a Director (and Super Admin) holds `vacancies:publish`.
export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/vacancies/[id]/status">) => {
    const staff = await requireApiPermission(request, "vacancies:publish");
    const { id } = await params;
    const input = await readJson(request, vacancyStatusChangeSchema);
    return ok(await changeVacancyStatus(staff, id, input));
  },
);
