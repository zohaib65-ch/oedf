"use client";

import { cn } from "cn";
import { useEffect, useState, type ReactNode } from "react";

const SCROLL_THRESHOLD_PX = 8;

/** The fixed header container: transparent glass at the top of the page, solid navy once scrolled. */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "surface-dark fixed inset-x-0 top-0 z-50 border-b border-white/10 text-foreground backdrop-blur-xl transition-all duration-300",
        isScrolled ? "bg-navy-deep/95 shadow-header" : "bg-navy-deep/25",
      )}
    >
      {children}
    </header>
  );
}
