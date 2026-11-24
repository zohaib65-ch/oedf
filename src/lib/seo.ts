import type { Metadata } from "next";

import { publicEnv } from "@/env";

/** The full URL of a path on this site. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** The page's path, such as `/programs`. It becomes the canonical URL. */
  path: string;
  type?: "website" | "article";
}

/** Title, description, canonical link and Open Graph tags for a public page. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type },
  };
}
