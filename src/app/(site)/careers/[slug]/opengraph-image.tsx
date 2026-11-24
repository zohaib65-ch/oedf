import { connection } from "next/server";

import { SITE_NAME } from "@/lib/constants/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getVacancy } from "@/server/services/vacancy.service";

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/careers/[slug]">) {
  await connection();
  const { slug } = await params;
  const d = await getVacancy(slug);
  return renderOgImage({ eyebrow: "Careers", title: d ? d.title : SITE_NAME });
}
