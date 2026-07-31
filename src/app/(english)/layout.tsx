import { RootDocument } from "@/components/layout/root-document";
import { buildBaseMetadata } from "@/lib/base-metadata";
import "../globals.css";

export const metadata = buildBaseMetadata("en");

export default function EnglishRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
