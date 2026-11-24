import { Container } from "@/components/shared/container";
import { IconCard } from "@/components/shared/icon-card";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { WHY_OEDF } from "@/content/home";

/** Governance and trust: registration, accountability, transparency and scholarships. */
export function WhyOedfSection() {
  return (
    <Section tone="warm" spacing="loose">
      <Container>
        <SectionHeading
          eyebrow={WHY_OEDF.eyebrow}
          title={WHY_OEDF.title}
          description={WHY_OEDF.description}
        />
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {WHY_OEDF.items.map((item) => (
            <IconCard key={item.title} {...item} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
