import { Metadata } from "next";
import config from "@/config";
import { getFrontmatters } from "@/libs/contents/markdown";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { sortPostsByDate } from "@/libs/contents/utils";
import { z } from "zod";
import { PostList } from "@/components/ui/PostList";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `キーワード | ${config.metadata.title}`,
  };
}

const getKeywords = (path: string[]) =>
  getFrontmatters({
    paths: path,
    schema: keywordFrontmatterSchema,
  });

type KeywordItem = z.infer<typeof keywordFrontmatterSchema> & { _path: string };

export default async function Page() {
  const programmingKeywords = (await getKeywords([
    "keywords",
    "programming",
  ])) as KeywordItem[];

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">キーワード</h1>
      <h2 className="mb-4 text-2xl border-b-1 border-neutral-500">
        プログラミング
      </h2>

      <PostList
        basePath="keywords"
        posts={sortPostsByDate<KeywordItem>(programmingKeywords)}
        variant="simple"
        showTags={false}
        showDate={false}
      />
    </main>
  );
}
