import { Tag } from "@/components/Tag";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
// import { getFrontmatters } from "@/libs/contents/blog";
import { compareDesc, format } from "date-fns";

export default async function Home() {
  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">ブログ</h1>
      <div className="flex flex-col gap-6 mb-8">
        {posts
          .sort((a, b) => compareDesc(a.frontmatter.date, b.frontmatter.date))
          .map((blog) => {
            if (!blog) {
              return <></>;
            }

            const { slug, frontmatter: frontmatter } = blog;

            return (
              <div key={slug}>
                <div className="flex gap-x-1 items-center font-thin">
                  <div className="i-mdi-calendar" />
                  <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
                </div>
                <a href={`/blog/${slug}/`} className="hover:underline">
                  {frontmatter.title}
                </a>
                <div className="flex flex-wrap mt-2 gap-2 text-xs">
                  {frontmatter.tags.map((tag) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </main>
  );
}
