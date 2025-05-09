import { getPaths } from "@/libs/contents/markdown";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatter } from "@/libs/contents/markdown";
import {
  OG_IMAGE_SIZE,
  OG_CONTENT_TYPE,
  loadJapaneseFont,
  generateOgImage,
} from "@/libs/og-image";

// メタデータ
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;

// 静的生成の設定
export const dynamic = "force-static";

// 静的生成のパラメータを提供
export async function generateStaticParams() {
  const ids = await getPaths("blog");
  return ids.map((id) => ({
    slug: id,
  }));
}

// 画像生成
export default async function Image({ params }: { params: { slug: string } }) {
  // 日本語フォントデータの取得
  const fontData = await loadJapaneseFont();

  // frontmatterの取得を試みる
  let title;
  let category = "Blog";
  let date = new Date().toLocaleDateString("ja-JP");

  try {
    const frontmatter = await getFrontmatter({
      paths: ["blog", params.slug],
      parser: Pages["blog"].frontmatter,
    });

    if (frontmatter) {
      title = frontmatter.title;
      if (frontmatter.category) {
        category = frontmatter.category;
      }
      if (frontmatter.date) {
        date = new Date(frontmatter.date).toLocaleDateString("ja-JP");
      }
    }
  } catch (error) {
    console.error("Frontmatter取得エラー:", error);
  }

  // タイトルがない場合はslugから生成
  if (!title) {
    title = params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // OGP画像を生成して返す
  return generateOgImage({
    title,
    category,
    date,
    fontData,
  });
}
