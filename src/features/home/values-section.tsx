import { Container } from "@/components/shared/container";
import { IconCard } from "@/components/shared/icon-card";
import { Section } from "@/components/shared/section";
import { VALUE_CARDS } from "@/content/home";

/** Three value statements under the hero. */
export function ValuesSection() {
  return (
    <Section>
      <Container>
        <h2 className="sr-only">What we stand for</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {VALUE_CARDS.map((card) => (
            <IconCard key={card.title} {...card} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
