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
              <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
              <a href={`/blog/${slug}/`} className="hover:underline">
                {frontmatter.title}
              </a>
            </div>
          );
        })}
      </div>
    </main>
  );
}
