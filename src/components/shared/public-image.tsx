import Image from "next/image";

import type { PublicImage as PublicImageData } from "@/server/services/image.service";

/** A record's photo on a public page: full width of its column, with the description staff wrote. */
export function PublicImage({ image }: { image: PublicImageData }) {
  return (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes="(min-width: 1024px) 66vw, 100vw"
      className="h-auto w-full rounded-2xl border border-border object-cover"
    />
  );
}
