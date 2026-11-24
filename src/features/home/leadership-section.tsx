import { UserRoundIcon } from "lucide-react";
import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { CEO_MESSAGE } from "@/content/about";
import { getDepartments } from "@/server/services/department.service";

const DIRECTOR_PLACEHOLDER = "To be appointed";

/** The CEO and the directors of the four departments. */
export async function LeadershipSection() {
  await connection();
  const departments = (await getDepartments()).filter(
    (department) => department.code !== "CEO_OFFICE",
  );
  const people = [
    { name: CEO_MESSAGE.name, role: CEO_MESSAGE.title },
    ...departments.map((department) => ({
      name: department.directorName || DIRECTOR_PLACEHOLDER,
      role: `Director, ${department.name}`,
    })),
  ];

  return (
    <Section className="surface-dark bg-navy-deep text-foreground">
      <Container>
        <SectionHeading eyebrow="Leadership" title="The people behind the foundation" />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {people.map((person) => (
            <li
              key={person.role}
              className="rounded-xl border border-white/15 bg-white/5 p-6 text-center"
            >
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold">
                <UserRoundIcon className="size-7" aria-hidden="true" />
              </span>
              <p className="mt-4 font-bold">{person.name}</p>
              <p className="mt-1 text-sm text-gray-300">{person.role}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
