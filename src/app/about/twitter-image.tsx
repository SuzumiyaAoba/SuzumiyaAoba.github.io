import config from "@/config";
import {
  OG_IMAGE_SIZE,
  OG_CONTENT_TYPE,
  loadJapaneseFont,
  generateOgImage,
} from "@/libs/og-image";

// 静的生成の設定
export const dynamic = "force-static";

// メタデータ
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "About - プロフィールとブログについて";

// デフォルトのTwitter画像を生成
export default async function Image() {
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
