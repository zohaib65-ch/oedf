import { directiveNoteSchema } from "@/lib/validations/directive";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { addDirectiveNote } from "@/server/services/directive.service";

// A progress update on the caller's office's part of the directive.
export const POST = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/directives/[id]/notes">) => {
    const staff = await requireApiPermission(request, "directives:update");
    const { id } = await params;
    const input = await readJson(request, directiveNoteSchema);
    return ok(await addDirectiveNote(staff, id, input), 201);
  },
);
