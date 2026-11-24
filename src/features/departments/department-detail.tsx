import { CheckCircle2Icon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { CtaButton } from "@/components/shared/cta-button";
import { DetailSection } from "@/components/shared/detail-section";
import { FactsCard } from "@/components/shared/facts-card";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ProseBlock } from "@/components/shared/prose-block";
import { ClosingCta } from "@/components/site/closing-cta";
import { DEPARTMENT_RELATED_PAGES } from "@/lib/constants/departments";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getDepartment } from "@/server/services/department.service";

const DIRECTOR_PLACEHOLDER = "To be appointed";

export async function DepartmentDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Departments", path: "/departments" },
          { name: department.name, path: `/departments/${department.slug}` },
        ])}
      />
      <PageHero eyebrow="Department" title={department.name} description={department.purpose} />
      <DetailSection
        backHref="/departments"
        backLabel="All departments"
        aside={
          <FactsCard
            title="Contact the department"
            facts={[
              {
                label: "Director",
                value: (
                  <span className="flex items-center gap-2">
                    <UserRoundIcon className="size-4 text-gold-text" aria-hidden="true" />
                    {department.directorName || DIRECTOR_PLACEHOLDER}
                  </span>
                ),
              },
            ]}
          >
            <CtaButton href="/contact" variant="gold" className="w-full">
              Send a message
            </CtaButton>
          </FactsCard>
        }
      >
        <ProseBlock title="Responsibilities">
          <ul className="space-y-3">
            {department.responsibilities.map((responsibility) => (
              <li key={responsibility} className="flex items-start gap-3 text-lg">
                <CheckCircle2Icon
                  className="mt-1 size-5 shrink-0 text-gold-text"
                  aria-hidden="true"
                />
                {responsibility}
              </li>
            ))}
          </ul>
        </ProseBlock>
        <ProseBlock title="Related pages">
          <ul className="flex flex-wrap gap-3">
            {DEPARTMENT_RELATED_PAGES[department.code].map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="inline-block rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold text-navy hover:border-navy"
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </ProseBlock>
      </DetailSection>
      <ClosingCta />
    </>
  );
}
