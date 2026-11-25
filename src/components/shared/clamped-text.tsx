"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Whole class names, so Tailwind sees them.
const CLAMP = { 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" } as const;

interface ClampedTextProps {
  text: string;
  /** How many lines show before the text is cut with "…". */
  lines: keyof typeof CLAMP;
  className?: string;
  /**
   * Set when the text sits in a whole-card link: the text is lifted above the link so it can show
   * its tooltip, and a click on it still opens the card.
   */
  href?: string;
}

/**
 * Text cut to a few lines. Only when something was actually cut does hovering show the whole text
 * in a tooltip. The cut is visual only, so screen readers always read the full text.
 */
export function ClampedText({ text, lines, className, href }: ClampedTextProps) {
  const router = useRouter();
  const ref = useRef<HTMLParagraphElement>(null);
  const [isCut, setIsCut] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measure = () => {
      setIsCut(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [text]);

  const paragraph = (
    <p
      ref={ref}
      className={cn(CLAMP[lines], isCut && href ? "relative z-10 cursor-pointer" : "", className)}
      onClick={
        isCut && href
          ? () => {
              router.push(href);
            }
          : undefined
      }
    >
      {text}
    </p>
  );

  if (!isCut) {
    return paragraph;
  }
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{paragraph}</TooltipTrigger>
        <TooltipContent className="max-w-sm text-sm leading-relaxed whitespace-pre-line">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
