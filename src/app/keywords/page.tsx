import { Metadata } from "next";
import config from "@/config";
import { getFrontmatters } from "@/libs/contents/markdown";
import { FC } from "react";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { sortPostsByDate } from "@/libs/contents/utils";

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
        {sortPostsByDate(
          keywords.filter((keyword) => keyword.frontmatter.parent)
        ).map((keyword) => (
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

const getKeywords = (path: string[]) =>
  getFrontmatters({
    paths: path,
    parser: { frontmatter: keywordFrontmatterSchema },
  });

export default async function Page() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">キーワード</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>

      <KeywordList
        title=""
        basePath="keywords"
        keywords={getKeywords(["keywords", "programming"])}
      />
    </main>
  );
}
