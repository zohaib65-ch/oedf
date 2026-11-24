import { jobApplicationStatusChangeSchema } from "@/lib/validations/job-application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { changeStatus } from "@/server/services/job-application-review.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/job-applications/[id]/status">) => {
    const staff = await requireApiPermission(request, "job-applications:review");
    const { id } = await params;
    const input = await readJson(request, jobApplicationStatusChangeSchema);
    return ok(await changeStatus(staff, id, input));
  },
);
