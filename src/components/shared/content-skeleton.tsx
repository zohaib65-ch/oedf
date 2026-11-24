import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_KEYS = ["first", "second", "third"] as const;

/** Shown while a page's content loads: three card outlines. */
export function CardGridSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {PLACEHOLDER_KEYS.map((key) => (
        <Skeleton key={key} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}

/** Shown while a detail page loads: a banner and a text block. */
export function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-96 rounded-none" />
      <Container className="max-w-3xl space-y-4 py-16">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
        <Skeleton className="h-6 w-1/2" />
      </Container>
    </div>
  );
}
