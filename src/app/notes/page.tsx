import { Metadata } from "next";
import config from "@/config";
import { Tag } from "@/components/Tag";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc, format } from "date-fns";
import { frontmatterSchema } from "@/libs/contents/notes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Notes | ${config.metadata.title}`,
  };
}

export default async function Page() {
  const posts = await getFrontmatters({
    paths: ["notes"],
    parser: { frontmatter: frontmatterSchema },
  });

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">Notes</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>
      <h3 className="mb-4 text-xl font-bold border-l-4 pl-2 border-neutral-600">
        Scala
      </h3>
      <div className="flex flex-col gap-6 mb-8">
        {posts
          .sort((a, b) => compareDesc(a.frontmatter.date, b.frontmatter.date))
          .map((note) => {
            if (!note) {
              return <></>;
            }

            const { path: slug, frontmatter } = note;

            return (
              <div key={slug}>
                <div className="flex gap-x-1 items-center font-thin">
                  <div className="i-mdi-calendar" />
                  <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
                </div>
                <a href={`/notes/${slug}/`} className="hover:underline">
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
