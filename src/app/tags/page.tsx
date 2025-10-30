import { Pages } from "@/libs/contents/blog";
import { getSortedPosts, countTagOccurrences } from "@/libs/contents/utils";
import { TagsPageClient } from "@/components/Pages/TagsPageClient";

export default async function TagsPage() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });

  // すべてのタグを抽出し、出現回数でカウント
  const tagCounts = countTagOccurrences(posts);

  // タグを出現回数でソート
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return <TagsPageClient sortedTags={sortedTags} />;
}
