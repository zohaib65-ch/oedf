import type { Metadata } from "next";

import { TERMS } from "@/content/legal";
import { LegalPage } from "@/features/legal/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: TERMS.title,
  description: TERMS.description,
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage document={TERMS} />;
}
