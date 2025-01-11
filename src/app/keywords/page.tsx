import { Metadata } from "next";
import config from "@/config";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc } from "date-fns";
import { frontmatterSchema } from "@/libs/contents/notes";
import { FC } from "react";
import { z } from "zod";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `キーワード | ${config.metadata.title}`,
  };
}

const Keywords: FC<{
  title: string;
  basePath: string;
  keywords: ReturnType<
    typeof getFrontmatters<z.infer<typeof frontmatterSchema>>
  >;
}> = async ({ title, basePath, keywords: promiseKeywords }) => {
  const keywords = await promiseKeywords;

  return (
    <>
      <h3 className="mb-1 text-xl font-bold border-l-4 pl-2 border-neutral-600">
        {title}
      </h3>
      <ul className="mb-8 pl-8 list-disc">
        {keywords
          .filter((note) => note.frontmatter.parent)
          .sort((a, b) => compareDesc(a.frontmatter.date, b.frontmatter.date))
          .map((note) => {
            if (!note) {
              return <></>;
            }

            const { path: slug, frontmatter } = note;

            return (
              <li key={slug}>
                <a href={`/${basePath}/${slug}/`} className="hover:underline">
                  {frontmatter.title}
                </a>
              </li>
            );
          })}
      </ul>
    </>
  );
};

export default async function Page() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">キーワード</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>
      <Keywords
        title=""
        basePath="keywords/programming"
        keywords={getFrontmatters({
          paths: ["keywords", "programming"],
          parser: { frontmatter: keywordFrontmatterSchema },
        })}
      />
    </main>
  );
}
