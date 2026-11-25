import { institutionFormSchema, listInstitutionsQuerySchema } from "@/lib/validations/institution";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  createInstitution,
  getInstitutionsForStaff,
} from "@/server/services/institution-management.service";

// Every institution, public or not, with filters, search and sorting.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "institutions:read");
  const query = listInstitutionsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getInstitutionsForStaff(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

// Making it public at once also needs `institutions:publish` (checked in the service).
export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "institutions:write");
  const input = await readJson(request, institutionFormSchema);
  return ok(await createInstitution(staff, input), 201);
});
