import type { Metadata } from "next";

import { DemoChrome } from "@/components/demo/demo-chrome";
import { DemoPortalProvider } from "@/lib/demo-portal";

import "../globals.css";

export const metadata: Metadata = {
  title: "Area ospiti — Demo | La Fenice Positano",
  description: "Dimostrazione locale dell’area ospiti di La Fenice Positano.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="it" suppressHydrationWarning>
      <body>
        <DemoPortalProvider>
          <DemoChrome>{children}</DemoChrome>
        </DemoPortalProvider>
      </body>
    </html>
  );
}
