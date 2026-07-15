import { buildRssXml } from "@/entities/blog/lib/rss";
import type { Locale } from "@/shared/lib/routing";

/**
 * 指定ロケールのRSSを返すGETハンドラを生成する。ja/en で locale 以外は共通。
 */
export function createRssRouteHandler(locale: Locale) {
  return async function GET() {
    const xml = await buildRssXml(locale);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    });
  };
}
