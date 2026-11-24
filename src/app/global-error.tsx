"use client";

import { ctaButtonVariants } from "@/components/shared/cta-button";

import "./globals.css";

// Replaces the root layout when it fails, so it brings its own <html> and <body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="surface-dark flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center text-foreground bg-hero">
        <h1 className="text-4xl font-extrabold tracking-tight">Something went wrong</h1>
        <p className="text-lg text-gray-300">Please try again, or come back in a few minutes.</p>
        <button type="button" onClick={reset} className={ctaButtonVariants({ size: "lg" })}>
          Try again
        </button>
      </body>
    </html>
  );
}
