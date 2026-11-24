import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { sendUserPasswordReset } from "@/server/services/user.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/users/[id]/reset-password">) => {
    const staff = await requireApiPermission(request, "users:manage");
    const { id } = await params;
    await sendUserPasswordReset(staff, id);
    return ok({ sent: true });
  },
);
