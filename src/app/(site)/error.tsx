"use client";

import { cn } from "cn";

import { CtaButton, ctaButtonVariants } from "@/components/shared/cta-button";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageHero
      eyebrow="Something went wrong"
      title="We could not load this page"
      description="Please try again. If the problem continues, contact us."
    >
      <Button onClick={reset} className={cn(ctaButtonVariants({ size: "lg" }))}>
        Try again
      </Button>
      <CtaButton href="/" variant="light" size="lg">
        Back to home
      </CtaButton>
    </PageHero>
  );
}
