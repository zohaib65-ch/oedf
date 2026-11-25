import { newsFormSchema } from "@/lib/validations/news";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  deleteNewsPost,
  getNewsPostForStaff,
  updateNewsPost,
} from "@/server/services/news-management.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/news/[id]">) => {
    await requireApiPermission(request, "news:manage");
    const { id } = await params;
    return ok(await getNewsPostForStaff(id));
  },
);

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/news/[id]">) => {
    const staff = await requireApiPermission(request, "news:manage");
    const { id } = await params;
    const input = await readJson(request, newsFormSchema);
    return ok(await updateNewsPost(staff, id, input));
  },
);

// Deleting also needs `content:delete` (checked in the service) and is audit-logged.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/news/[id]">) => {
    const staff = await requireApiPermission(request, "news:manage");
    const { id } = await params;
    await deleteNewsPost(staff, id);
    return new Response(null, { status: 204 });
  },
);
