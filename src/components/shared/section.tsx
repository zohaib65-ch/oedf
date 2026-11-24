import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

const sectionVariants = cva("", {
  variants: {
    tone: { default: "", warm: "bg-warm" },
    spacing: { default: "py-20", loose: "py-24" },
  },
  defaultVariants: { tone: "default", spacing: "default" },
});

/** A full-width band with the reference's vertical rhythm (80 or 96 px). */
export function Section({
  tone,
  spacing,
  className,
  ...props
}: ComponentProps<"section"> & VariantProps<typeof sectionVariants>) {
  return <section className={cn(sectionVariants({ tone, spacing }), className)} {...props} />;
}
