import { auditLogQuerySchema } from "@/lib/validations/audit-log";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { getAuditLog } from "@/server/services/audit-log.service";

export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "audit:read");
  const query = auditLogQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { items, total } = await getAuditLog(query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});
