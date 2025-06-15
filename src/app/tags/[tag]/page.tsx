import { Timeline } from "@/components/Article/Timeline";
import { Tag } from "@/components/Tag";
import { Pages } from "@/libs/contents/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSortedPosts, filterPostsByTag } from "@/libs/contents/utils";
import { generateBlogTagParams } from "@/libs/contents/params";

export async function generateStaticParams() {
  return generateBlogTagParams({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });
}

type Props = {
  params: Promise<{ tag: string }>;
};

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const posts = await getSortedPosts({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });

  // 指定されたタグを持つ記事をフィルタリング
  const taggedPosts = filterPostsByTag(posts, decodedTag);

  if (taggedPosts.length === 0) {
    notFound();
  }

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

      <Timeline posts={taggedPosts} />
    </main>
  );
}
