import {
  OG_IMAGE_SIZE,
  OG_CONTENT_TYPE,
  loadJapaneseFont,
  generateOgImage,
} from "@/libs/og-image";
import { getFrontmatter } from "@/libs/contents/markdown";
import { Pages } from "@/libs/contents/blog";

// 静的生成の設定
export const dynamic = "force-static";

// メタデータ
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Blog Post OGP Image";

type Props = {
  params: Promise<{ slug: string }>;
};

// ブログ記事のOGP画像を生成
export default async function Image({ params }: Props) {
  const { slug } = await params;

  // フロントマターを取得
  const frontmatter = await getFrontmatter({
    paths: ["blog", slug],
    schema: Pages["blog"].frontmatter,
  });

  if (!frontmatter) {
    // フロントマターが取得できない場合はデフォルト画像
    const fontData = await loadJapaneseFont();
    return generateOgImage({
      title: "Blog Post",
      category: "Blog",
      fontData,
    });
  }

  // 日本語フォントデータの取得
  const fontData = await loadJapaneseFont();

  // ブログ記事用のOGP画像を生成して返す
  return generateOgImage({
    title: frontmatter.title,
    category: frontmatter.category,
    date: new Date(frontmatter.date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    fontData,
  });
}
