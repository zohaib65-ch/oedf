import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ContactDetails } from "@/features/contact/contact-details";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "How to reach Omar Education Development Foundation: address, phone, email and office hours.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        description="Visit, call or write to us. We reply to messages as soon as we can."
      />
      <Section tone="warm">
        <Container>
          <Suspense fallback={<DetailSkeleton />}>
            <ContactDetails />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
