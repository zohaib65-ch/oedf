import { listProgramsQuerySchema, programFormSchema } from "@/lib/validations/program";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { createProgram, getProgramsForStaff } from "@/server/services/program-management.service";

// Every program, drafts and archived ones included, with filters, search and sorting.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "programs:read");
  const query = listProgramsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getProgramsForStaff(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

// Staff save drafts; a status other than Draft also needs `programs:publish` (checked in the service).
export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "programs:write");
  const input = await readJson(request, programFormSchema);
  return ok(await createProgram(staff, input), 201);
});
