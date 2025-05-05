import { Metadata } from "next";
import config from "@/config";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc } from "date-fns";
import { FC } from "react";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `キーワード | ${config.metadata.title}`,
  };
}

type KeywordItem = {
  path: string;
  frontmatter: {
    title: string;
    date: Date;
    parent?: boolean;
    [key: string]: unknown;
  };
};

const KeywordList: FC<{
  title: string;
  basePath: string;
  keywords: Promise<KeywordItem[]>;
}> = async ({ title, basePath, keywords: promiseKeywords }) => {
  const keywords = await promiseKeywords;

  return (
    <>
      {title && (
        <h3 className="mb-1 text-xl font-bold border-l-4 pl-2 border-neutral-600">
          {title}
        </h3>
      )}
      <ul className="mb-8 pl-8 list-disc">
        {keywords
          .filter((keyword) => keyword.frontmatter.parent)
          .sort((a, b) => compareDesc(a.frontmatter.date, b.frontmatter.date))
          .map((keyword) => (
            <li key={keyword.path}>
              <a
                href={`/${basePath}/${keyword.path}/`}
                className="hover:underline"
              >
                {keyword.frontmatter.title}
              </a>
            </li>
          ))}
      </ul>
    </>
  );
};

export default async function KeywordsPage() {
  const programmingKeywords = getFrontmatters({
    paths: ["keywords", "programming"],
    parser: { frontmatter: keywordFrontmatterSchema },
  });

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">キーワード</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>
      <KeywordList
        title=""
        basePath="keywords/programming"
        keywords={programmingKeywords}
      />
    </main>
  );
}
