import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { absoluteUrl } from "@/lib/seo";
import { getSitemapRecords } from "@/server/services/sitemap.service";

// Pages that always exist. The status lookup is left out: it has nothing for a search to find.
const STATIC_PATHS = [
  "/",
  "/about",
  "/team",
  "/governance",
  "/departments",
  "/programs",
  "/institutions",
  "/admissions",
  "/admissions/apply",
  "/scholarships",
  "/scholarships/apply",
  "/careers",
  "/research",
  "/news",
  "/faqs",
  "/contact",
  "/privacy-policy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The sitemap reads the database, so it is built on request and never during `npm run build`.
  await connection();
  const records = await getSitemapRecords();
  const detailPages = [
    ["/departments", records.departments],
    ["/programs", records.programs],
    ["/institutions", records.institutions],
    ["/careers", records.vacancies],
    ["/research", records.publications],
    ["/news", records.news],
  ] as const;

  return [
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...detailPages.flatMap(([base, items]) =>
      items.map((item) => ({
        url: absoluteUrl(`${base}/${item.slug}`),
        lastModified: item.updatedAt,
      })),
    ),
  ];
}
