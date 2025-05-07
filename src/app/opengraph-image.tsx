import config from "@/config";
import {
  OG_IMAGE_SIZE,
  OG_CONTENT_TYPE,
  loadJapaneseFont,
  generateHomeOgImage,
} from "@/libs/og-image";

// メタデータ
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = config.metadata.title;

// Edgeランタイムの代わりに静的出力に設定
// export const runtime = "edge";
export const dynamic = "force-static";

// デフォルトのOGP画像を生成
export default async function Image() {
  // 日本語フォントデータの取得
  const fontData = await loadJapaneseFont();

  // ホームページOGP画像を生成して返す
  return generateHomeOgImage({
    fontData,
  });
}
