import { faqFormSchema } from "@/lib/validations/faq";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { createFaq, getFaqsForStaff } from "@/server/services/faq-management.service";

// Every question, published or not, by topic and position. The CEO Office manages them.
export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "faqs:manage");
  return ok(await getFaqsForStaff());
});

export const POST = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "faqs:manage");
  const input = await readJson(request, faqFormSchema);
  return ok(await createFaq(staff, input), 201);
});
