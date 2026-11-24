import Link from "next/link";
import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { DraftNotice } from "@/components/shared/draft-notice";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { GOVERNANCE_INTRO, KEY_POLICIES, POLICY_DRAFT_NOTICE } from "@/content/governance";
import { SECP_REGISTRATION_NUMBER } from "@/lib/constants/site";
import { getDepartments } from "@/server/services/department.service";

const DIRECTOR_PLACEHOLDER = "To be appointed";

export async function GovernanceContent() {
  await connection();
  const departments = await getDepartments();

  return (
    <>
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Structure"
            title="How the foundation is organised"
            description={GOVERNANCE_INTRO}
          />
          <ul className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
            {departments.map((department) => (
              <li
                key={department.id}
                className="rounded-xl border border-border bg-white p-6 shadow-card"
              >
                <h3 className="text-lg font-bold text-foreground">
                  <Link href={`/departments/${department.slug}`} className="hover:underline">
                    {department.name}
                  </Link>
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Director: {department.directorName || DIRECTOR_PLACEHOLDER}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <Section tone="warm">
        <Container className="max-w-3xl text-center">
          <SectionHeading
            eyebrow="Registration"
            title={`SECP Registration No. ${SECP_REGISTRATION_NUMBER}`}
            description="The foundation is registered with the Securities and Exchange Commission of Pakistan."
          />
        </Container>
      </Section>
      <Section>
        <Container className="space-y-10">
          <SectionHeading eyebrow="Policies" title="Key policies" />
          <div className="mx-auto max-w-4xl">
            <DraftNotice>{POLICY_DRAFT_NOTICE}</DraftNotice>
          </div>
          <ul className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {KEY_POLICIES.map((policy) => (
              <li
                key={policy.title}
                className="rounded-xl border border-border bg-white p-6 shadow-card"
              >
                <h3 className="text-lg font-bold text-foreground">{policy.title}</h3>
                <p className="mt-2 text-muted-foreground">{policy.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
