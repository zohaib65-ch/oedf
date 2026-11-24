"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

/** The toast area every portal save reports to. */
export function PortalProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
