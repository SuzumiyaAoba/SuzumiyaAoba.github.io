const GOOGLE_FONTS_CSS_URL = "https://fonts.googleapis.com/css2";

/** 古い Android の UA で問い合わせると、Satori が読める TrueType の URL が返る。 */
const FONT_FETCH_USER_AGENT =
  "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Droid Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

const TRUETYPE_SRC_RE = /src: url\((.+?)\) format\(['"]?truetype['"]?\)/u;

async function fetchGoogleFont(family: string): Promise<ArrayBuffer> {
  const cssUrl = `${GOOGLE_FONTS_CSS_URL}?family=${family}&display=swap`;
  const cssResponse = await fetch(cssUrl, {
    headers: {
      "User-Agent": FONT_FETCH_USER_AGENT,
    },
  });
  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch font CSS (${family}): ${cssResponse.status} ${cssResponse.statusText}`
    );
  }
  const fontUrl = TRUETYPE_SRC_RE.exec(await cssResponse.text())?.[1];
  if (!fontUrl) {
    throw new Error(`Failed to find a TrueType source for ${family}`);
  }

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch font (${family}): ${fontResponse.status} ${fontResponse.statusText}`
    );
  }
  return await fontResponse.arrayBuffer();
}

type OpengraphFont = {
  name: string;
  data: ArrayBuffer;
  style: "normal" | "italic";
  weight: 400 | 700;
};

/** サイトの書体に合わせ、本文はゴシック（Noto Sans JP）、サイト名はセリフ体の斜体（Newsreader）。 */
const FONT_SOURCES = [
  {
    family: "Noto+Sans+JP:wght@400",
    name: "Noto Sans JP",
    style: "normal",
    weight: 400,
  },
  {
    family: "Noto+Sans+JP:wght@700",
    name: "Noto Sans JP",
    style: "normal",
    weight: 700,
  },
  {
    family: "Newsreader:ital,wght@1,400",
    name: "Newsreader",
    style: "italic",
    weight: 400,
  },
] as const;

let opengraphFontsPromise: Promise<OpengraphFont[]> | null = null;

/**
 * OGP 画像描画用のフォントデータを取得する。
 * blog/notes/series/tags/books など複数の opengraph-image ルートから
 * 呼ばれるため、同一ビルドプロセス内では一度だけ取得しキャッシュする。
 */
export async function loadOpengraphFonts(): Promise<OpengraphFont[]> {
  opengraphFontsPromise ??= Promise.all(
    FONT_SOURCES.map(async ({ family, ...font }) => ({
      ...font,
      data: await fetchGoogleFont(family),
    }))
  );
  return await opengraphFontsPromise;
}
