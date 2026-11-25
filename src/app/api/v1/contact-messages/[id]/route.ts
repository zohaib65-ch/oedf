import { messageUpdateSchema } from "@/lib/validations/message";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { changeMessageStatus, getMessage } from "@/server/services/message-inbox.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/contact-messages/[id]">) => {
    const staff = await requireApiPermission(request, "messages:read");
    const { id } = await params;
    return ok(await getMessage(staff, id));
  },
);

// `{ status }`: New, Read, Replied or Archived. Audit-logged.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/contact-messages/[id]">) => {
    const staff = await requireApiPermission(request, "messages:manage");
    const { id } = await params;
    const input = await readJson(request, messageUpdateSchema);
    return ok(await changeMessageStatus(staff, id, input));
  },
);
