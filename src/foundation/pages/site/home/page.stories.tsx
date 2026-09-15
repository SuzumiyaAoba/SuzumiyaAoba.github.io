import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import { HomePageContent } from "./ui/page-content";
import type { HomePageContentProps } from "./ui/page-content";

const titles = [
  ["Iterator パターン", "Iterator pattern"],
  ["ローカル AI エージェントの実行環境", "Running AI agents locally"],
  ["Java のコレクションと反復処理", "Collections and iteration in Java"],
  ["Scala の型クラス", "Type classes in Scala"],
  ["Nix による開発環境の構成", "Development environments with Nix"],
  ["週報 2026年5月第3週", "Weekly report: May 2026, week 3"],
] as const;
const dummyPosts: HomePageContentProps["latestPosts"] = titles.map(([ja, en], index) => {
  const slug = `post-${index + 1}`;
  const summary = (title: string, english: boolean) => ({
    slug,
    frontmatter: {
      title,
      date: `2026-05-${27 - index}`,
      category: english ? "Programming" : "プログラミング",
      description: english
        ? "Implementation examples and notes on the design."
        : "実装例と設計についての解説。コードを確認しながら動作を整理する。",
      tags: ["Java"],
    },
  });
  return { slug, ja: summary(ja, false), en: summary(en, true) };
});

const series: HomePageContentProps["series"] = [
  { slug: "design-patterns", name: "デザインパターン", posts: ["post-1", "post-3"] },
  { slug: "local-ai", name: "ローカル AI エージェント", posts: ["post-2"] },
  { slug: "scala", name: "Scala", posts: ["post-4"] },
  { slug: "nix", name: "Nix", posts: ["post-5"] },
];

const meta: Meta<typeof HomePageContent> = {
  title: "pages/site/Home",
  component: HomePageContent,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    locale: "ja",
    latestPosts: dummyPosts,
    postCount: dummyPosts.length,
    series,
    notes: [
      { slug: "java", title: "Java" },
      { slug: "scala", title: "Scala" },
      { slug: "nix", title: "Nix" },
      { slug: "functional-programming", title: "関数型プログラミング" },
    ],
    topics: [
      { name: "Java", count: 2 },
      { name: "Scala", count: 1 },
      { name: "Nix", count: 1 },
    ],
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof HomePageContent>;

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const writing = within(canvas.getByRole("region", { name: "最新の記事" }));
    await expect(
      writing.getAllByRole("heading", { level: 3 }).map((item) => item.textContent),
    ).toEqual(titles.map(([ja]) => ja));
    await expect(writing.getByRole("link", { name: /Iterator パターン/u })).toHaveAttribute(
      "href",
      "/blog/post/post-1/",
    );
    const overview = within(canvas.getByRole("navigation", { name: "コンテンツ" }));
    await expect(overview.getByRole("link", { name: /ブログ/u })).toHaveTextContent("6記事");
    await expect(canvasElement.querySelectorAll(".site-page > header.site-header")).toHaveLength(1);
    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(canvas.getAllByRole("contentinfo")).toHaveLength(1);
  },
};

export const English: Story = {
  args: {
    locale: "en",
    series: series.map((item, index) => ({
      ...item,
      name: ["Design patterns", "Local AI agents", "Scala", "Nix"][index] ?? item.name,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = within(canvas.getByRole("main"));
    const writing = within(main.getByRole("region", { name: "Latest articles" }));
    await expect(
      writing.getAllByRole("heading", { level: 3 }).map((item) => item.textContent),
    ).toEqual(titles.map(([, en]) => en));
    await expect(writing.getByRole("link", { name: /Iterator pattern/u })).toHaveAttribute(
      "href",
      "/en/blog/post/post-1/",
    );
    const notes = within(main.getByRole("region", { name: "Notes" }));
    await expect(notes.getByRole("link", { name: "Java" })).toHaveAttribute(
      "href",
      "/en/notes/java/",
    );
    await expect(notes.getByRole("link", { name: "Books (Japanese)" })).toHaveAttribute(
      "href",
      "/books/",
    );
    await expect(notes.getByRole("link", { name: "Books (Japanese)" })).toHaveAttribute(
      "hreflang",
      "ja",
    );
    await expect(main.getByRole("link", { name: /ASCII reference/u })).toHaveAttribute(
      "href",
      "/en/tools/ascii-standard-code/",
    );
    const topics = within(main.getByRole("navigation", { name: "Browse by tag" }));
    await expect(topics.getByRole("link", { name: /Java/u })).toHaveAttribute(
      "href",
      "/en/tags/Java/",
    );
  },
};

export const Empty: Story = {
  args: {
    latestPosts: [],
    postCount: 0,
    series: [],
    notes: [],
    topics: [],
  },
  play: async ({ canvasElement }) => {
    const main = within(within(canvasElement).getByRole("main"));
    await expect(main.getByText("記事はまだありません。")).toBeVisible();
    await expect(main.getByText("ノートはまだありません。")).toBeVisible();
    await expect(main.queryByRole("region", { name: "連載" })).not.toBeInTheDocument();
    await expect(
      main.queryByRole("navigation", { name: "タグから記事を探す" }),
    ).not.toBeInTheDocument();
    await expect(main.queryAllByRole("article")).toHaveLength(0);
  },
};

export const TranslationFallback: Story = {
  args: {
    locale: "en",
    latestPosts: [
      {
        slug: "japanese-only",
        ja: {
          slug: "japanese-only",
          frontmatter: { title: "日本語のみの記事", date: "2026-05-27" },
        },
        en: null,
      },
      { slug: "missing", ja: null, en: null },
      {
        slug: "english-only",
        ja: null,
        en: {
          slug: "english-only",
          frontmatter: { title: "English only", date: "2026-05-26" },
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const writing = within(within(canvasElement).getByRole("region", { name: "Latest articles" }));
    await expect(
      writing.getAllByRole("heading", { level: 3 }).map((item) => item.textContent),
    ).toEqual(["日本語のみの記事", "English only"]);
    await expect(writing.getByRole("link", { name: /日本語のみの記事/u })).toHaveAttribute(
      "href",
      "/en/blog/post/japanese-only/",
    );
    await expect(writing.getByRole("link", { name: /English only/u })).toHaveAttribute(
      "href",
      "/en/blog/post/english-only/",
    );
  },
};
