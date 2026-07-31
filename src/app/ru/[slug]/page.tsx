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
  return getLocalizedStaticParams("ru");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = getContentRouteFromSlug("ru", slug);
  return route ? buildMetadata("ru", route) : {};
}

export default async function RussianContentPage({ params }: PageProps) {
  const { slug } = await params;
  const route = getContentRouteFromSlug("ru", slug);
  if (!route) notFound();
  return <RoutePage locale="ru" route={route} />;
}
