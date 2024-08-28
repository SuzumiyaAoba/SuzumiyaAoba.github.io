import { Tag } from "@/components/Tag";
import * as blog from "@/libs/blog";
import { format } from "date-fns";

export default async function Home() {
  const blogs = await blog.getAll();

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <h1 className="mt-8 mb-8 text-3xl">ブログ</h1>
      <div className="flex flex-col gap-6">
        {blogs.map((blog) => {
          if (!blog) {
            return <></>;
          }

          const { slug, frontmatter } = blog;

          return (
            <div key={slug}>
              <div className="flex gap-x-1 items-center font-thin">
                <div className="i-mdi-calendar" />
                <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
              </div>
              <a href={`/blog/${slug}/`} className="hover:underline">
                {frontmatter.title}
              </a>
              <div className="mt-2 flex gap-x-2 text-xs">
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
