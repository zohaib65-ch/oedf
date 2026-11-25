import { listNewsQuerySchema, newsFormSchema } from "@/lib/validations/news";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { createNewsPost, getNewsForStaff } from "@/server/services/news-management.service";

// Every news post and event, drafts and archived ones included. The CEO Office manages them.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "news:manage");
  const query = listNewsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { items, total } = await getNewsForStaff(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "news:manage");
  const input = await readJson(request, newsFormSchema);
  return ok(await createNewsPost(staff, input), 201);
});
