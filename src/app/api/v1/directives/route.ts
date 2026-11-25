import { issueDirectiveSchema, listDirectivesQuerySchema } from "@/lib/validations/directive";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { getDirectives, issueDirective } from "@/server/services/directive.service";

// The CEO Office, Super Admin and Research & Policy see every directive; other offices see theirs.
export const GET = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "directives:read");
  const query = listDirectivesQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const { items, total } = await getDirectives(staff, query);
  return Response.json({
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  });
});

// Only the Research & Policy Institute issues directives. The target offices' Directors are emailed.
export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "directives:issue");
  const input = await readJson(request, issueDirectiveSchema);
  return ok(await issueDirective(staff, input), 201);
});
