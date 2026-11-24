import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footerLink?: { href: string; label: string };
}

/** The frame of the sign-in, forgot-password and reset-password pages. */
export function AuthCard({ title, description, children, footerLink }: AuthCardProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-white p-8 shadow-card">
        <Link href="/" aria-label="Omar Education Development Foundation, home" className="block">
          <Logo size="md" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        {children}
        {footerLink ? (
          <p className="text-center text-sm">
            <Link
              href={footerLink.href}
              className="font-semibold text-navy underline underline-offset-2"
            >
              {footerLink.label}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
