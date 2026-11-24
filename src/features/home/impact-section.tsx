import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

const numberFormat = new Intl.NumberFormat("en-US");

/** The impact numbers from Settings. Hidden until at least one number is entered. */
export async function ImpactSection() {
  await connection();
  const settings = await getPublicSiteSettings();
  if (!settings || settings.impactNumbers.length === 0) {
    return null;
  }

  return (
    <Section className="surface-dark text-foreground bg-hero">
      <Container>
        <SectionHeading eyebrow="Our impact" title="The foundation in numbers" />
        <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {settings.impactNumbers.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur-sm"
            >
              <dd className="text-4xl font-extrabold text-gold">
                {numberFormat.format(item.value)}
              </dd>
              <dt className="mt-2 text-gray-300">{item.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
