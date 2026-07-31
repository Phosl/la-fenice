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
    <section className="page-body">
      <div className="container page-body__grid">
        <aside className="page-body__aside">
          <div className="page-body__aside-inner">
            <span className="page-body__aside-index">01</span>
            <span className="page-body__aside-label">{label}</span>
          </div>
        </aside>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
