import Link from "next/link";

import { Container } from "@/components/shared/container";
import { CtaButton } from "@/components/shared/cta-button";
import { HERO, HERO_MINI_CARDS } from "@/content/home";

/** The home page hero: mission, two buttons and three quick links. */
export function HeroSection() {
  return (
    <div className="surface-dark pt-44 pb-20 text-foreground bg-hero">
      <Container>
        <div className="max-w-4xl">
          <p className="inline-block rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight text-balance md:text-6xl">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-300">{HERO.description}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaButton href="/admissions" size="lg">
              Apply for admission or scholarship
            </CtaButton>
            <CtaButton href="/programs" variant="light" size="lg">
              Explore programs
            </CtaButton>
          </div>
        </div>
        <ul className="mt-16 grid gap-4 md:grid-cols-3">
          {HERO_MINI_CARDS.map(({ icon: Icon, title, description, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full items-start gap-4 rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-gold/40 hover:bg-white/10"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-bold">{title}</span>
                  <span className="mt-1 block text-gray-300">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
