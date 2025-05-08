import { Tag } from "@/components/Tag";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc, format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

type PostCardProps = {
  slug: string;
  frontmatter: {
    title: string;
    date: Date;
    tags: string[];
  };
};

const PostCard = ({ slug, frontmatter }: PostCardProps) => {
  return (
    <div className="card p-4 transition-all duration-300 hover:transform hover:scale-[1.02]">
      <div
        className="flex gap-x-1 items-center font-thin text-sm"
        style={{ color: "var(--muted)" }}
      >
        <div className="i-mdi-calendar" />
        <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
      </div>
      <Link
        href={`/blog/${slug}/`}
        className="text-lg font-semibold block my-2 transition-colors"
        style={{
          color: "var(--foreground)",
        }}
      >
        {frontmatter.title}
      </Link>
      <div className="flex flex-wrap mt-2 gap-2 text-xs">
        {frontmatter.tags.map((tag) => (
          <Tag
            key={tag}
            label={tag}
            href={`/tags/${encodeURIComponent(tag)}/`}
          />
        ))}
      </div>
    </div>
  );
};

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
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-4 text-3xl flex items-center flex-wrap gap-2">
        <span>タグ:</span> <Tag label={decodedTag} size="lg" />
      </h1>
      <div className="mb-6">
        <Link
          href="/tags/"
          className="hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          ← タグ一覧に戻る
        </Link>
      </div>
      <div className="flex flex-col gap-6 mb-8">
        {sortedPosts.map((post) => (
          <PostCard
            key={post.path}
            slug={post.path}
            frontmatter={post.frontmatter}
          />
        ))}
      </div>
    </main>
  );
}
