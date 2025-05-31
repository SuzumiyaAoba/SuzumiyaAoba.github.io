import { Timeline } from "@/components/Article/Timeline";
import { Tag } from "@/components/Tag";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  // すべてのタグを抽出し、一意のリストを作成
  const allTags = new Set<string>();
  posts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      allTags.add(tag);
    });
  });

  return Array.from(allTags).map((tag) => ({
    tag: tag,
  }));
}

type Props = {
  params: Promise<{ tag: string }>;
};

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  // 指定されたタグを持つ記事をフィルタリング
  const taggedPosts = posts.filter((post) =>
    post.frontmatter.tags.includes(decodedTag)
  );

  if (taggedPosts.length === 0) {
    notFound();
  }

  // 日付順に並べ替え（新しい順）
  const sortedPosts = taggedPosts.sort((a, b) =>
    compareDesc(a.frontmatter.date, b.frontmatter.date)
  );

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-6 py-10 pb-20">
      <h1 className="mb-10 text-3xl font-bold flex items-center flex-wrap gap-2">
        <span>タグ:</span> <Tag label={decodedTag} size="lg" />
      </h1>

      <div className="mb-6">
        <Link
          href="/tags/"
          className="hover:underline text-base"
          style={{ color: "var(--accent-primary)" }}
        >
          ← タグ一覧に戻る
        </Link>
      </div>

      <Timeline posts={sortedPosts} />
    </main>
  );
}
