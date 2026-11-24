import { createUserSchema, listUsersQuerySchema } from "@/lib/validations/user";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { createUser, getUsers } from "@/server/services/user.service";

export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "users:manage");
  const query = listUsersQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { items, total } = await getUsers(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "users:manage");
  const input = await readJson(request, createUserSchema);
  return ok(await createUser(staff, input), 201);
});
