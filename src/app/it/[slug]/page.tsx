import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoutePage } from "@/components/pages/route-page";
import { routeKeys, routeSlugs } from "@/lib/content/routes";
import type { RouteKey } from "@/lib/content/types";
import { buildMetadata } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ slug: string }> };

const contentRoutes = routeKeys.filter((route): route is Exclude<RouteKey, "home"> => route !== "home");

function getRoute(slug: string): Exclude<RouteKey, "home"> | null {
  return contentRoutes.find((route) => routeSlugs.it[route] === slug) ?? null;
}

export function generateStaticParams() {
  return contentRoutes.map((route) => ({ slug: routeSlugs.it[route] }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = getRoute(slug);
  return route ? buildMetadata("it", route) : {};
}

export default async function ItalianContentPage({ params }: PageProps) {
  const { slug } = await params;
  const route = getRoute(slug);
  if (!route) notFound();
  return <RoutePage locale="it" route={route} />;
}
