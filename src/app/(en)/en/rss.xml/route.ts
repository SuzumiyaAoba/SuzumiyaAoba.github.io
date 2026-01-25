import { buildRssXml } from "@/entities/blog/lib/rss";

export const dynamic = "force-static";

export async function GET() {
  const xml = await buildRssXml("en");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
