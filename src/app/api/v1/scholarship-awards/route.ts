import { listAwardsQuerySchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { getAwards } from "@/server/services/scholarship-award.service";

export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "awards:read");
  const query = listAwardsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { items, total } = await getAwards(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});
