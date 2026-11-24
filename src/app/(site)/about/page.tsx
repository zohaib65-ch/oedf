import type { Metadata } from "next";

import { PageHero } from "@/components/shared/page-hero";
import { ClosingCta } from "@/components/site/closing-cta";
import { AboutContent } from "@/features/about/about-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "The story, mission, vision and values of Omar Education Development Foundation.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="About Omar Education Development Foundation"
        description="Our story, mission and values, and a message from our Chief Executive Officer."
      />
      <AboutContent />
      <ClosingCta />
    </>
  );
}
