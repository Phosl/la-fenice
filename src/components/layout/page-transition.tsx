"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PageTransitionProps = {
  accent?: boolean;
  children: ReactNode;
};

export function PageTransition({ accent = false, children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      className="page-transition"
      data-accent={accent ? "true" : undefined}
      key={pathname}
    >
      {children}
    </div>
  );
}
