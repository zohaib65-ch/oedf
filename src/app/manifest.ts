import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

// Browsers and search engines read the site's name, icons and colours from here. A manifest
// cannot use CSS variables, so the colours repeat the navy and page tokens in globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "OEDF",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#0b1120",
    lang: "en",
    categories: ["education"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
