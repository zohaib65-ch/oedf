import { cn } from "cn";
import type { ComponentProps } from "react";

/** Page width: 1280 px at most, with 24 px side padding. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6", className)} {...props} />;
}
