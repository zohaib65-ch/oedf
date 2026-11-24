import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the link to a page number. */
  getHref: (page: number) => string;
  className?: string;
}

/** Previous and next links with the current position. Renders nothing for a single page. */
export function Pagination({ page, pageCount, getHref, className }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  const linkClass =
    "inline-flex items-center gap-1 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-navy";

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-12 flex items-center justify-between gap-4", className)}
    >
      {page > 1 ? (
        <Link href={getHref(page - 1)} rel="prev" className={linkClass}>
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={getHref(page + 1)} rel="next" className={linkClass}>
          Next
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
