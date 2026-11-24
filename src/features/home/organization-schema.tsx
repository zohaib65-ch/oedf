import { connection } from "next/server";

import { JsonLd } from "@/components/shared/json-ld";
import { organizationJsonLd } from "@/lib/structured-data";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

/** Structured data that describes the foundation to search engines. */
export async function OrganizationSchema() {
  await connection();
  return <JsonLd data={organizationJsonLd(await getPublicSiteSettings())} />;
}
