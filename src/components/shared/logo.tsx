import { cn } from "cn";
import Image from "next/image";

import { SITE_NAME } from "@/lib/constants/site";

const LOGO_WIDTH = 1599;
const LOGO_HEIGHT = 892;

// Heights in pixels. The header row is 82 px high, so the header logo is 56 px.
const LOGO_HEIGHTS = { sm: 40, md: 56, lg: 96 } as const;

interface LogoProps {
  size?: keyof typeof LOGO_HEIGHTS;
  /** On dark surfaces the logo sits on a white rounded plate, because only the full-color JPEG exists. */
  isOnDark?: boolean;
  className?: string;
}

/** The OEDF logo, exactly as supplied. A white version and an icon-only mark are not available yet. */
export function Logo({ size = "md", isOnDark = false, className }: LogoProps) {
  const height = LOGO_HEIGHTS[size];
  return (
    <Image
      src="/brand/logo-full.jpeg"
      alt={SITE_NAME}
      width={Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT)}
      height={height}
      className={cn("w-auto", isOnDark && "rounded-xl bg-logo-plate", className)}
    />
  );
}
