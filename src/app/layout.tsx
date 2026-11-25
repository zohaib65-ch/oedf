import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { publicEnv } from "@/env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";
import { OG_LOCALE } from "@/lib/seo";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "education",
  openGraph: { type: "website", siteName: SITE_NAME, locale: OG_LOCALE },
  twitter: { card: "summary_large_image" },
  // Large image previews in search results. The portal and API turn indexing off for themselves.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Numbers such as the SECP registration number are not phone numbers.
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
