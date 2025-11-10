import { loadJapaneseFont, generateHomeOgImage } from "@/libs/og-image";

// 静的生成の設定
export const dynamic = "force-static";

// ホームページのTwitter画像を生成（OGP画像と同じデザイン）
export async function GET() {
  // 日本語フォントデータの取得
  const fontData = await loadJapaneseFont();

  // ホームページOGP画像を生成して返す（Twitter画像も同じデザイン）
  return generateHomeOgImage({
    fontData,
  });
}
