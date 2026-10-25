import { createRssRouteHandler } from "@/app/_shared/rss-route";

export function getStaticPaths() {
  return [{ params: { locale: undefined } }, { params: { locale: "en" } }];
}
export async function GET({ params }: { params: { locale?: string } }) {
  return await createRssRouteHandler(params.locale === "en" ? "en" : "ja")();
}
