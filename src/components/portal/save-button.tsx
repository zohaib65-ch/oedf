import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

interface SaveButtonProps extends Omit<ComponentProps<typeof Button>, "type"> {
  isPending: boolean;
  pendingLabel?: string;
}

/** A submit button that is disabled and shows a spinner while a save is running. */
export function SaveButton({
  isPending,
  pendingLabel = "Saving…",
  children,
  ...props
}: SaveButtonProps) {
  return (
    <Button type="submit" disabled={isPending} {...props}>
      {isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
      {isPending ? pendingLabel : children}
    </Button>
  );
}
