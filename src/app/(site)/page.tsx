import { SITE_NAME, SITE_SHORT_NAME } from "@/lib/constants/site";

// Holding page. The real home page is built in Phase 3.
export default function HomePage() {
  return (
    <main className="surface-dark flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold tracking-[0.22em] text-gold uppercase">
        {SITE_SHORT_NAME}
      </p>
      <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
        {SITE_NAME}
      </h1>
      <p className="text-lg text-muted-foreground">Our new website is on its way.</p>
    </main>
  );
}
