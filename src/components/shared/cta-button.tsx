import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

export const ctaButtonVariants = cva(
  "relative overflow-hidden rounded-full font-semibold shadow-button transition-all duration-300",
  {
    variants: {
      variant: {
        // Navy text on the gold gradient: white text fails WCAG contrast (docs/design-system.md).
        gold: "bg-linear-to-r from-gold-from to-gold-to text-navy hover:scale-102 hover:bg-transparent hover:brightness-110 after:absolute after:inset-0 after:-translate-x-full after:-skew-x-16 after:bg-linear-to-r after:from-transparent after:via-white/30 after:to-transparent after:transition-transform after:duration-700 hover:after:translate-x-full",
        light: "border-gold/70 bg-white text-navy hover:bg-white/90",
      },
      size: { md: "h-11 px-7 text-sm", lg: "h-14 px-8 text-base" },
    },
    defaultVariants: { variant: "gold", size: "md" },
  },
);

type CtaButtonProps = Omit<ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof ctaButtonVariants> & { className?: string };

/** A pill-shaped call-to-action link in the reference's gold or light style. */
export function CtaButton({ variant, size, className, ...props }: CtaButtonProps) {
  return (
    <Button asChild className={cn(ctaButtonVariants({ variant, size }), className)}>
      <Link {...props} />
    </Button>
  );
}
