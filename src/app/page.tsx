import { Tag } from "@/components/Tag";
import { getFrontmatters } from "@/libs/contents";
import { compareDesc, format } from "date-fns";

export default async function Home() {
  const posts = await Array.fromAsync(getFrontmatters("blog"));

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">ブログ</h1>
      <div className="flex flex-col gap-6">
        {posts
          .sort((a, b) => compareDesc(a.frontmatter.date, b.frontmatter.date))
          .map((blog) => {
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
