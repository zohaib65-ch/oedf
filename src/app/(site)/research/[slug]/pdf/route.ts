import { connection } from "next/server";

import { getPublicationPdfUrl } from "@/server/services/publication.service";

/**
 * Sends a visitor to a published publication's PDF through a link that expires after 5 minutes.
 * The PDF of a draft, archived or deleted publication is never handed out.
 */
export async function GET(_request: Request, { params }: RouteContext<"/research/[slug]/pdf">) {
  await connection();
  const { slug } = await params;
  const url = await getPublicationPdfUrl(slug);
  if (!url) {
    return new Response("This file is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store" },
  });
}
