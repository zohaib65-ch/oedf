import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/shared/container";
import { CardGridSkeleton } from "@/components/shared/content-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ClosingCta } from "@/components/site/closing-cta";
import { DepartmentList } from "@/features/departments/department-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Departments",
  description: "The Chief Executive Office and the four departments that run the foundation.",
  path: "/departments",
});

export default function DepartmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Departments"
        title="The offices behind the foundation"
        description="The Chief Executive Office and the four departments, each with its own purpose."
      />
      <Section>
        <Container>
          <Suspense fallback={<CardGridSkeleton />}>
            <DepartmentList />
          </Suspense>
        </Container>
      </Section>
      <ClosingCta />
    </>
  );
}
