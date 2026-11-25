import { faqFormSchema } from "@/lib/validations/faq";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { deleteFaq, updateFaq } from "@/server/services/faq-management.service";

export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/faqs/[id]">) => {
    const staff = await requireApiPermission(request, "faqs:manage");
    const { id } = await params;
    const input = await readJson(request, faqFormSchema);
    return ok(await updateFaq(staff, id, input));
  },
);

// Deleting also needs `content:delete` (checked in the service) and is audit-logged.
export const DELETE = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/faqs/[id]">) => {
    const staff = await requireApiPermission(request, "faqs:manage");
    const { id } = await params;
    await deleteFaq(staff, id);
    return new Response(null, { status: 204 });
  },
);
