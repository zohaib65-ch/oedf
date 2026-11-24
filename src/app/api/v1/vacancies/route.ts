import { listVacanciesQuerySchema, vacancyFormSchema } from "@/lib/validations/vacancy";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { createVacancy, getVacanciesForStaff } from "@/server/services/vacancy-management.service";

// Every vacancy, drafts included, with filters, search and sorting.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "vacancies:read");
  const query = listVacanciesQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getVacanciesForStaff(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

// A new vacancy is always a draft.
export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "vacancies:write");
  const input = await readJson(request, vacancyFormSchema);
  return ok(await createVacancy(staff, input), 201);
});
