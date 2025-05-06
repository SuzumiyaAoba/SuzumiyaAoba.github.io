import config from "@/config";
import { getPaths } from "@/libs/contents/markdown";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatter } from "@/libs/contents/markdown";

// 動的生成を指定
export const dynamic = "force-dynamic";

// 静的生成のパラメータを提供
export async function generateStaticParams() {
  const ids = await getPaths("blog");
  return ids.map((id) => ({
    slug: id,
  }));
}

export default async function generateAlt({
  params,
}: {
  params: { slug: string };
}) {
  // frontmatterの取得を試みる
  let title;
  let category = "Blog";

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

  // altテキストを生成
  return `${title} - ${category} | ${config.metadata.title}`;
}
