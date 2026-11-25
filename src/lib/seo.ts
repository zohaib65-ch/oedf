import type { Metadata } from "next";

import { publicEnv } from "@/env";
import { SITE_NAME } from "@/lib/constants/site";

/** The full URL of a path on this site. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}

/** Open Graph locale: English, written for Pakistan. */
export const OG_LOCALE = "en_PK";

/**
 * The site-wide share image (`src/app/opengraph-image.tsx`). A page that sets its own `openGraph`
 * replaces the layout's, image included, so pages without their own image name this one.
 */
const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

interface PageMetadataInput {
  title: string;
  description: string;
  /** The page's path, such as `/programs`. It becomes the canonical URL. */
  path: string;
  type?: "website" | "article";
  /**
   * The page has its own `opengraph-image.tsx` (the detail pages). Next.js then uses that file,
   * as long as the metadata does not name an image itself.
   */
  hasOwnImage?: boolean;
}

/** Title, description, canonical link, Open Graph and X (Twitter) card for a public page. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  hasOwnImage = false,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      ...(hasOwnImage ? {} : { images: [DEFAULT_OG_IMAGE] }),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
