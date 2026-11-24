import { cn } from "cn";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Left-aligned headings sit beside content; centered ones introduce a full-width band. */
  align?: "center" | "left";
  className?: string;
}

/** The gold eyebrow chip, title and intro that open a page section. Dark sections use `.surface-dark`. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p className="inline-block rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-bold tracking-widest text-gold-text uppercase [.surface-dark_&]:bg-gold/10 [.surface-dark_&]:text-gold">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-balance text-foreground md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground [.surface-dark_&]:text-gray-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}
