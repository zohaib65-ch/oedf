import type { Metadata } from "next";

import { Container } from "@/components/shared/container";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { publicEnv } from "@/env";
import { StatusChecker } from "@/features/application-status/status-checker";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Application status",
    description: "Check where your admission or scholarship application stands.",
    path: "/application-status",
  }),
  // The page itself holds no personal data, but there is nothing in it for a search to find.
  robots: { index: false },
};

export default function ApplicationStatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Application status"
        title="Check your application"
        description="Enter the reference number from your confirmation email and the email address you applied with."
      />
      <Section tone="warm">
        <Container className="max-w-2xl">
          <StatusChecker turnstileSiteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </Container>
      </Section>
    </>
  );
}
