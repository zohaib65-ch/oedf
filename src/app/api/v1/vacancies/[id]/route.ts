import { vacancyFormSchema } from "@/lib/validations/vacancy";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deleteVacancy,
  getVacancyForStaff,
  updateVacancy,
} from "@/server/services/vacancy-management.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/vacancies/[id]">) => {
    await requireApiPermission(request, "vacancies:read");
    const { id } = await params;
    return ok(await getVacancyForStaff(id));
  },
);

// The form sends every field. Changing a published vacancy also needs `vacancies:publish`, which
// the service checks once it knows the status.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/vacancies/[id]">) => {
    const staff = await requireApiPermission(request, "vacancies:write");
    const { id } = await params;
    const input = await readJson(request, vacancyFormSchema);
    return ok(await updateVacancy(staff, id, input));
  },
);

// Only a draft that nobody has applied to can be deleted.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/vacancies/[id]">) => {
    const staff = await requireApiPermission(request, "vacancies:write");
    const { id } = await params;
    await deleteVacancy(staff, id);
    return new Response(null, { status: 204 });
  },
);
