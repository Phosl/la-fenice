import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoutePage } from "@/components/pages/route-page";
import {
  getContentRouteFromSlug,
  getLocalizedStaticParams,
} from "@/lib/content/localized-routes";
import { buildMetadata } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getLocalizedStaticParams("de");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = getContentRouteFromSlug("de", slug);
  return route ? buildMetadata("de", route) : {};
}

export default async function GermanContentPage({ params }: PageProps) {
  const { slug } = await params;
  const route = getContentRouteFromSlug("de", slug);
  if (!route) notFound();
  return <RoutePage locale="de" route={route} />;
}
