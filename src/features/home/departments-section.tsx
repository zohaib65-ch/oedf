import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { DepartmentCard } from "@/components/site/department-card";
import { getDepartments } from "@/server/services/department.service";

/** The four departments (the Chief Executive Office leads them and has its own page). */
export async function DepartmentsSection() {
  await connection();
  const departments = (await getDepartments()).filter(
    (department) => department.code !== "CEO_OFFICE",
  );
  if (departments.length === 0) {
    return null;
  }

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Departments"
          title="Four departments, one mission"
          description="Each department has a defined purpose and a director who answers for it."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {departments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/departments" variant="gold">
            All departments
          </CtaButton>
        </div>
      </Container>
    </Section>
  );
}
