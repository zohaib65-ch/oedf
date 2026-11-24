import { jobApplicationUpdateSchema } from "@/lib/validations/job-application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import {
  getJobApplicationDetail,
  updateJobApplication,
} from "@/server/services/job-application-review.service";

export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/job-applications/[id]">) => {
    await requireApiPermission(request, "job-applications:read");
    const { id } = await params;
    return ok(await getJobApplicationDetail(id));
  },
);

// Sets the interview time, or archives or restores the application.
export const PATCH = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/job-applications/[id]">) => {
    const staff = await requireApiPermission(request, "job-applications:review");
    const { id } = await params;
    const input = await readJson(request, jobApplicationUpdateSchema);
    return ok(await updateJobApplication(staff, id, input));
  },
);
