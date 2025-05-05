import { Tag } from "@/components/Tag";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc, format } from "date-fns";
import Link from "next/link";

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
    <div>
      <div className="flex gap-x-1 items-center font-thin">
        <div className="i-mdi-calendar" />
        <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
      </div>
      <Link href={`/blog/${slug}/`} className="hover:underline">
        {frontmatter.title}
      </Link>
      <div className="flex flex-wrap mt-2 gap-2 text-xs">
        {frontmatter.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>
    </div>
  );
};

export default async function BlogPage() {
  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  const sortedPosts = posts.sort((a, b) =>
    compareDesc(a.frontmatter.date, b.frontmatter.date)
  );

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Blog</h1>
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
