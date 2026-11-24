import { noteInputSchema } from "@/lib/validations/common";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { addAwardProgressNote } from "@/server/services/scholarship-award.service";

export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/scholarship-awards/[id]/notes">) => {
    const staff = await requireApiPermission(request, "awards:manage");
    const { id } = await params;
    const { body } = await readJson(request, noteInputSchema);
    return ok(await addAwardProgressNote(staff, id, body), 201);
  },
);
