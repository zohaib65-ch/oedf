import type { Metadata } from "next";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { ClosingCta } from "@/components/site/closing-cta";
import { GovernanceContent } from "@/features/governance/governance-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Governance",
  description:
    "How Omar Education Development Foundation is organised, its SECP registration and its key policies.",
  path: "/governance",
});

export default function GovernancePage() {
  return (
    <>
      <PageHero
        eyebrow="Governance"
        title="Governance and accountability"
        description="How the foundation is registered, organised and held to account."
      />
      <Suspense fallback={<DetailSkeleton />}>
        <GovernanceContent />
      </Suspense>
      <ClosingCta />
    </>
  );
}
