import {
  loadJapaneseFont,
  generateOgImage,
} from "@/libs/og-image";

// 静的生成の設定
export const dynamic = "force-static";

// About ページのTwitter画像を生成
export async function GET() {
  // 日本語フォントデータの取得
  const fontData = await loadJapaneseFont();

  // About ページ用のOGP画像を生成して返す（Twitter画像も同じデザイン）
  return generateOgImage({
    title: "About Me",
    category: "Profile",
    date: new Date().toLocaleDateString("ja-JP"),
    fontData,
  });
}
