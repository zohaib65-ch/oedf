import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { ABOUT_STORY, CEO_MESSAGE, MISSION } from "@/content/about";

/** A short About block: the mission and a link to the full story. */
export function AboutTeaser() {
  return (
    <Section>
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="About the foundation" title="Our mission" />
          <p className="mt-6 text-xl leading-relaxed text-foreground">{MISSION}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{ABOUT_STORY[0]}</p>
          <div className="mt-8">
            <CtaButton href="/about" variant="gold">
              About OEDF
            </CtaButton>
          </div>
        </div>
        <figure className="rounded-xl border border-border bg-warm p-10">
          <blockquote className="text-lg leading-relaxed text-foreground">
            {CEO_MESSAGE.paragraphs[0]}
          </blockquote>
          <figcaption className="mt-6">
            <span className="block font-bold text-foreground">{CEO_MESSAGE.name}</span>
            <span className="text-muted-foreground">{CEO_MESSAGE.title}</span>
          </figcaption>
        </figure>
      </Container>
    </Section>
  );
}
