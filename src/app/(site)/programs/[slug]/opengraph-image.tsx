import { connection } from "next/server";

import { SITE_NAME } from "@/lib/constants/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getProgram } from "@/server/services/program.service";

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/programs/[slug]">) {
  await connection();
  const { slug } = await params;
  const d = await getProgram(slug);
  return renderOgImage({ eyebrow: "Program", title: d ? d.title : SITE_NAME });
}
