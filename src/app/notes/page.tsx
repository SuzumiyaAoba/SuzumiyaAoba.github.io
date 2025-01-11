import { Metadata } from "next";
import config from "@/config";
import { Tag } from "@/components/Tag";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc, format } from "date-fns";
import { frontmatterSchema } from "@/libs/contents/notes";
import { FC } from "react";
import { z } from "zod";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Notes | ${config.metadata.title}`,
  };
}

const Notes: FC<{
  title: string;
  basePath: string;
  notes: ReturnType<typeof getFrontmatters<z.infer<typeof frontmatterSchema>>>;
}> = async ({ title, basePath, notes: promiseNotes }) => {
  const notes = await promiseNotes;

  return (
    <>
      <h3 className="mb-4 text-xl font-bold border-l-4 pl-2 border-neutral-600">
        {title}
      </h3>
      <div className="flex flex-col gap-6 mb-8">
        {notes
          .filter((note) => note.frontmatter.parent)
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
                <a
                  href={`/notes/${basePath}/${slug}/`}
                  className="hover:underline"
                >
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
    </>
  );
};

export default async function Page() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">Notes</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>
      <Notes
        title="Scala"
        basePath="programming/scala"
        notes={getFrontmatters({
          paths: ["notes", "programming", "scala"],
          parser: { frontmatter: frontmatterSchema },
        })}
      />
      <Notes
        title="本"
        basePath="programming/books"
        notes={getFrontmatters({
          paths: ["notes", "programming", "books"],
          parser: { frontmatter: frontmatterSchema },
        })}
      />
    </main>
  );
}
