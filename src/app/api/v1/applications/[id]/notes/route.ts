import { noteInputSchema } from "@/lib/validations/application-review";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { addNote } from "@/server/services/application-review.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/applications/[id]/notes">) => {
    const staff = await requireApiPermission(request, "applications:review");
    const { id } = await params;
    const { body } = await readJson(request, noteInputSchema);
    return ok(await addNote(staff, id, body), 201);
  },
);
