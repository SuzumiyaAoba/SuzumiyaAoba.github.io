import { notFound } from "next/navigation";
import { Metadata } from "next";
import config from "@/config";
import {
  getContent,
  getFrontmatter,
  getAvailableLanguages,
} from "@/libs/contents/markdown";
import { bookFrontmatterSchema } from "@/libs/contents/schema";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import { generateBookChapterParams } from "@/libs/contents/params";
import {
  LanguageToggle,
  type LanguageContent,
} from "@/components/LanguageToggle";

const CONTENT_BASE_PATH = "books";

type PageParams = {
  name: string;
  chapter: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams(): Promise<PageParams[]> {
  return generateBookChapterParams(CONTENT_BASE_PATH);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, chapter } = await params;
  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, name, chapter],
    schema: bookFrontmatterSchema,
  });

  if (!frontmatter) {
    return {
      title: config.metadata.title,
    };
  }

  return {
    title: `${frontmatter.title} | ${config.metadata.title}`,
    description: frontmatter.title,
  };
}

const languageLabels: Record<string, string> = {
  ja: "日本語",
  en: "English",
};

export default async function BookChapterPage({ params }: PageProps) {
  const { name, chapter } = await params;

  const content = await getContent({
    paths: [CONTENT_BASE_PATH, name, chapter],
    schema: bookFrontmatterSchema,
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;

  // 利用可能な言語を取得
  const availableLanguages = await getAvailableLanguages(
    CONTENT_BASE_PATH,
    name,
    chapter,
  );

  // 各言語のコンテンツを取得
  const languageContents: LanguageContent[] = [];

  for (const lang of availableLanguages) {
    const langContent = await getContent({
      paths: [CONTENT_BASE_PATH, name, chapter],
      schema: bookFrontmatterSchema,
      lang: lang === "ja" ? undefined : lang,
    });

    if (langContent) {
      const LangComponent = langContent.Component;
      languageContents.push({
        lang,
        label: languageLabels[lang] || lang.toUpperCase(),
        content: <LangComponent />,
      });
    }
  }

  return (
    <>
      <StylesheetLoader
        stylesheets={stylesheets}
        basePath={CONTENT_BASE_PATH}
        slug={[name, chapter]}
      />
      <Article
        title={frontmatter.title}
        date={frontmatter.date}
        tags={frontmatter.tags ?? []}
      >
        {languageContents.length > 0 ? (
          <LanguageToggle defaultLanguage="ja" languages={languageContents} />
        ) : (
          <Component />
        )}
      </Article>
    </>
  );
}
