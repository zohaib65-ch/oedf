"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BlockedIconButtonProps {
  icon: LucideIcon;
  /** What the button would do, for example "Delete Science Fair". */
  label: string;
  /** Why it cannot be done now, shown in the tooltip. */
  reason: string;
}

/** A greyed-out icon action in a table row, with a tooltip saying why it is not available. */
export function BlockedIconButton({ icon: Icon, label, reason }: BlockedIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A disabled button gets no hover or focus, so this wrapper carries the tooltip. */}
        <span tabIndex={0} className="inline-flex rounded-lg">
          <Button variant="ghost" size="icon" disabled aria-label={`${label}: ${reason}`}>
            <Icon aria-hidden="true" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
