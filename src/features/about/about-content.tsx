import { Container } from "@/components/shared/container";
import { DraftNotice } from "@/components/shared/draft-notice";
import { IconCard } from "@/components/shared/icon-card";
import { Section } from "@/components/shared/section";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  ABOUT_STORY,
  CEO_MESSAGE,
  CORE_VALUES,
  MISSION,
  MISSION_VISION_ICONS,
  VISION,
} from "@/content/about";

const COPY_DRAFT_NOTICE =
  "Draft: this text is a placeholder until the foundation reviews and supplies its own.";

export function AboutContent() {
  const MissionIcon = MISSION_VISION_ICONS.mission;
  const VisionIcon = MISSION_VISION_ICONS.vision;

  return (
    <>
      <Section>
        <Container className="max-w-3xl space-y-6">
          <SectionHeading align="left" eyebrow="Our story" title="Who we are" />
          {ABOUT_STORY.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-foreground">
              {paragraph}
            </p>
          ))}
          <DraftNotice>{COPY_DRAFT_NOTICE}</DraftNotice>
        </Container>
      </Section>
      <Section tone="warm">
        <Container className="grid gap-8 md:grid-cols-2">
          <IconCard icon={MissionIcon} title="Mission" description={MISSION} />
          <IconCard icon={VisionIcon} title="Vision" description={VISION} />
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading eyebrow="Values" title="What guides our work" />
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value) => (
              <IconCard key={value.title} {...value} />
            ))}
          </div>
        </Container>
      </Section>
      <Section tone="warm">
        <Container className="max-w-3xl">
          <SectionHeading align="left" eyebrow="Message from the CEO" title={CEO_MESSAGE.name} />
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-foreground">
            {CEO_MESSAGE.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-6 font-semibold text-muted-foreground">{CEO_MESSAGE.title}</p>
          {CEO_MESSAGE.isDraft ? (
            <div className="mt-6">
              <DraftNotice>
                Draft: the CEO&apos;s own message has not been supplied yet.
              </DraftNotice>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
