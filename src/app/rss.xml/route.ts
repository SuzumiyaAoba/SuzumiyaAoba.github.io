import { buildRssXml } from "@/entities/blog/lib/rss";

export const dynamic = "force-static";

export async function GET() {
  const xml = await buildRssXml("ja");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
