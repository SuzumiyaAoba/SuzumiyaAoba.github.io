const SHIPPORI_MINCHO_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&display=swap";

const FONT_FETCH_USER_AGENT =
  "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Droid Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

async function fetchShipporiMinchoBold(): Promise<ArrayBuffer> {
  const cssResponse = await fetch(new URL(SHIPPORI_MINCHO_CSS_URL).href, {
    headers: {
      "User-Agent": FONT_FETCH_USER_AGENT,
    },
  });
  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch font CSS: ${cssResponse.status} ${cssResponse.statusText}`
    );
  }
  const fontCss = await cssResponse.text();

  const fontUrl = /src: url\((.+?)\) format\(['"]?truetype['"]?\)/u.exec(
    fontCss
  )?.[1];
  if (!fontUrl) {
    throw new Error("Failed to load font");
  }

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch font: ${fontResponse.status} ${fontResponse.statusText}`
    );
  }
  return await fontResponse.arrayBuffer();
}

let shipporiMinchoBoldPromise: Promise<ArrayBuffer> | null = null;

/**
 * OGP画像描画用の Shippori Mincho (bold) フォントデータを取得する。
 * blog/notes/series/tags/books など複数の opengraph-image ルートから
 * 呼ばれるため、同一ビルドプロセス内では一度だけ取得しキャッシュする。
 */
export async function loadShipporiMinchoBold(): Promise<ArrayBuffer> {
  shipporiMinchoBoldPromise ??= fetchShipporiMinchoBold();
  return await shipporiMinchoBoldPromise;
}
