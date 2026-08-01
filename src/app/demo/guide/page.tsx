import type { Metadata } from "next";

import { PositanoGuide } from "@/components/demo/guest/positano-guide";

export const metadata: Metadata = {
  title: "Guida a Positano · Area ospite demo",
  description:
    "La guida riservata agli ospiti di La Fenice, con indirizzi e informazioni utili per il soggiorno a Positano.",
  robots: { index: false, follow: false },
};

export default function DemoGuidePage() {
  return <PositanoGuide />;
}
