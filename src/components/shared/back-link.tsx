import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

/** The link back to a list from a detail page. */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline"
    >
      <ArrowLeftIcon className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
