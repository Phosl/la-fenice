"use client";

import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div className="page-transition" key={pathname}>
      {children}
    </div>
  );
}
