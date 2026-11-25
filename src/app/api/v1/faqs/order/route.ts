import { faqOrderSchema } from "@/lib/validations/faq";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { reorderFaqs } from "@/server/services/faq-management.service";

// `{ category, ids }`: every question in the topic, first to last.
export const PATCH = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "faqs:manage");
  await reorderFaqs(staff, await readJson(request, faqOrderSchema));
  return new Response(null, { status: 204 });
});
