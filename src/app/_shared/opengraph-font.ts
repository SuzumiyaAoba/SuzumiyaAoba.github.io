const SHIPPORI_MINCHO_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&display=swap";

const FONT_FETCH_USER_AGENT =
  "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Droid Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

async function fetchShipporiMinchoBold(): Promise<ArrayBuffer> {
  const fontCss = await fetch(new URL(SHIPPORI_MINCHO_CSS_URL).href, {
    headers: {
      "User-Agent": FONT_FETCH_USER_AGENT,
    },
  }).then((res) => res.text());

  const fontUrl = fontCss.match(/src: url\((.+?)\) format\(['"]?truetype['"]?\)/)?.[1];
  if (!fontUrl) {
    throw new Error("Failed to load font");
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

let shipporiMinchoBoldPromise: Promise<ArrayBuffer> | null = null;

/**
 * OGP画像描画用の Shippori Mincho (bold) フォントデータを取得する。
 * blog/notes/series/tags/books など複数の opengraph-image ルートから
 * 呼ばれるため、同一ビルドプロセス内では一度だけ取得しキャッシュする。
 */
export function loadShipporiMinchoBold(): Promise<ArrayBuffer> {
  if (!shipporiMinchoBoldPromise) {
    shipporiMinchoBoldPromise = fetchShipporiMinchoBold();
  }
  return shipporiMinchoBoldPromise;
}
