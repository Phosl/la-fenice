import type { ReactNode } from "react";

type PageBodyLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  label: string;
};

export function PageBodyLayout({
  children,
  contentClassName,
  label,
}: PageBodyLayoutProps) {
  return (
    <section aria-label={label} className="page-body">
      <div className="container page-body__grid">
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
