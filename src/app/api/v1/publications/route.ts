import { listPublicationsQuerySchema, publicationFormSchema } from "@/lib/validations/publication";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  createPublication,
  getPublicationsForStaff,
} from "@/server/services/publication-management.service";

// Every publication, drafts and archived ones included, with filters, search and sorting.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "publications:read");
  const query = listPublicationsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getPublicationsForStaff(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

// Staff save drafts; any other status also needs `publications:publish` (checked in the service).
export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "publications:write");
  const input = await readJson(request, publicationFormSchema);
  return ok(await createPublication(staff, input), 201);
});
