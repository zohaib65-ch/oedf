import { requireApiSession } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { getFileDownloadUrl } from "@/server/services/file.service";

// Sends staff to a link that works for 5 minutes. The redirect is never cached.
export const GET = withApiHandler(
  async (request, { params }: RouteContext<"/api/v1/files/[id]">) => {
    const staff = await requireApiSession(request);
    const { id } = await params;
    const url = await getFileDownloadUrl(staff, id);
    return new Response(null, {
      status: 302,
      headers: { Location: url, "Cache-Control": "no-store" },
    });
  },
);
