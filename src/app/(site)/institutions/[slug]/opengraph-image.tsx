import { connection } from "next/server";

import { SITE_NAME } from "@/lib/constants/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getInstitution } from "@/server/services/institution.service";

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/institutions/[slug]">) {
  await connection();
  const { slug } = await params;
  const d = await getInstitution(slug);
  return renderOgImage({ eyebrow: "Institution", title: d ? d.name : SITE_NAME });
}
