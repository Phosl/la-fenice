import { RootDocument } from "@/components/layout/root-document";
import { buildBaseMetadata } from "@/lib/base-metadata";
import "../globals.css";

export const metadata = buildBaseMetadata("it");

export default function ItalianRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="it">{children}</RootDocument>;
}
