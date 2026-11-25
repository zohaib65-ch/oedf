import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ContactDetails } from "@/features/contact/contact-details";
import { ContactForm } from "@/features/contact/contact-form";
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
        <Container className="grid items-start gap-8 lg:grid-cols-2">
          <Suspense fallback={<DetailSkeleton />}>
            <ContactDetails />
          </Suspense>
          <div className="rounded-xl border border-border bg-white p-8 shadow-card md:p-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Send us a message
            </h2>
            <p className="mt-2 mb-6 text-muted-foreground">
              Choose the subject that fits best, and your message reaches the right office.
            </p>
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
