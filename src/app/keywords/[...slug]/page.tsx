import { notFound } from "next/navigation";
import { Metadata } from "next";
import config from "@/config";
import {
  getContent,
  getFrontmatter,
  getAvailableLanguages,
} from "@/libs/contents/markdown";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import { generateNestedSlugParams } from "@/libs/contents/params";
import {
  LanguageToggle,
  type LanguageContent,
} from "@/components/LanguageToggle";

type Props = {
  params: Promise<{ slug: string[] }>;
};

const contentBasePath = "keywords";

export async function generateStaticParams() {
  return generateNestedSlugParams(contentBasePath);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: [contentBasePath, ...slug],
    schema: keywordFrontmatterSchema,
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

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getContent({
    paths: [contentBasePath, ...slug],
    schema: keywordFrontmatterSchema,
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;

  // 利用可能な言語を取得
  const availableLanguages = await getAvailableLanguages(
    contentBasePath,
    ...slug,
  );

  // 各言語のコンテンツを取得
  const languageContents: LanguageContent[] = [];

  for (const lang of availableLanguages) {
    const langContent = await getContent({
      paths: [contentBasePath, ...slug],
      schema: keywordFrontmatterSchema,
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
        basePath={contentBasePath}
        slug={slug}
      />
      <Article
        title={frontmatter.title}
        date={frontmatter.date}
        tags={frontmatter.tags}
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
