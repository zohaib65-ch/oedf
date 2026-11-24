import { connection } from "next/server";

import { SITE_NAME } from "@/lib/constants/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getNewsPost } from "@/server/services/news.service";

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/news/[slug]">) {
  await connection();
  const { slug } = await params;
  const d = await getNewsPost(slug);
  return renderOgImage({ eyebrow: "News and events", title: d ? d.title : SITE_NAME });
}
