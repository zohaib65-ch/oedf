import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { HOW_TO_APPLY } from "@/content/home";

/** Four numbered steps for applying. */
export function StepsSection() {
  return (
    <Section tone="warm">
      <Container>
        <SectionHeading eyebrow={HOW_TO_APPLY.eyebrow} title={HOW_TO_APPLY.title} />
        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {HOW_TO_APPLY.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-border bg-white p-8 shadow-card"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-linear-to-r from-gold-from to-gold-to text-lg font-extrabold text-navy">
                {index + 1}
              </span>
              <h3 className="mt-6 text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
