import type { Metadata } from "next";

import { PRIVACY_POLICY } from "@/content/legal";
import { LegalPage } from "@/features/legal/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: PRIVACY_POLICY.title,
  description: PRIVACY_POLICY.description,
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return <LegalPage document={PRIVACY_POLICY} />;
}
