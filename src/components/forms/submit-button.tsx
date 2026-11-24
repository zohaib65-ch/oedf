import { Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { ctaButtonVariants } from "@/components/shared/cta-button";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isSubmitting: boolean;
  children: ReactNode;
}

/** The gold submit button. It is disabled while sending, so a form cannot be submitted twice. */
export function SubmitButton({ isSubmitting, children }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={ctaButtonVariants({ variant: "gold", size: "lg" })}
    >
      {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
      {isSubmitting ? "Sending…" : children}
    </Button>
  );
}
