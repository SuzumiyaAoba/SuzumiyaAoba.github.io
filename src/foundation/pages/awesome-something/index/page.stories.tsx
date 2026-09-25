import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import type { AwesomeItem } from "./model/awesome-item";
import { AwesomeSomethingPageContent } from "./ui/page-content";

const items: AwesomeItem[] = [
  {
    id: "example-library",
    name: "Example Library",
    category: "development",
    subcategory: "libraries",
    tags: ["TypeScript", "バリデーション"],
    description: "データの検証を扱うライブラリ。\n型の推論にも対応しています。",
    websiteUrl: "https://example.com/library/",
    githubUrl: "https://github.com/example/library",
    articles: [
      { url: "https://example.com/library/introduction" },
      { title: "使い方を学ぶ", url: "https://example.com/library/guide" },
    ],
    relatedPosts: [
      { title: "試してみた記録", url: "/blog/post/example-library/" },
    ],
  },
  {
    id: "example-service",
    name: "Example Service",
    category: "ai-memory",
    subcategory: "knowledge",
    tags: ["ナレッジ管理"],
    description: "日々の発見やアイデアをまとめるサービス。",
    websiteUrl: "https://example.com/service/",
    articles: [],
    relatedPosts: [],
  },
  {
    id: "example-framework",
    name: "Example Framework",
    category: "ai-agents",
    subcategory: "frameworks",
    tags: ["TypeScript", "Web開発"],
    description: "Web アプリケーションを構築するためのフレームワーク。",
    githubUrl: "https://github.com/example/framework",
    articles: [],
    relatedPosts: [],
  },
  {
    id: "example-app",
    name: "Example App",
    category: "media",
    subcategory: "video",
    tags: [],
    description: "見つけたばかりのアプリケーション。リンクは後で追記。",
    articles: [],
    relatedPosts: [],
  },
];

const meta = {
  title: "Pages/AwesomeSomething/Index",
  component: AwesomeSomethingPageContent,
  parameters: { layout: "fullscreen" },
  args: { locale: "ja", items },
} satisfies Meta<typeof AwesomeSomethingPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "開発・プログラミング" })
    ).toHaveAttribute("href", "/awesome-something/development/");
    await expect(
      canvas.getByRole("link", { name: "文書処理・汎用ライブラリ 1" })
    ).toHaveAttribute("href", "/awesome-something/development/libraries/");
    await expect(
      canvas.getByRole("link", { name: "すべての項目を見る・検索する" })
    ).toHaveAttribute("href", "/awesome-something/all/");
    await expect(
      canvas.queryByRole("article", { name: "Example Library" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: "デザイン・UI" })
    ).not.toBeInTheDocument();
  },
};

export const English: Story = {
  args: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", {
        name: "Development & programming",
      })
    ).toHaveAttribute("href", "/en/awesome-something/development/");
    await expect(
      canvas.getByRole("link", { name: "Documents & libraries 1" })
    ).toHaveAttribute("href", "/en/awesome-something/development/libraries/");
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("まだ登録がありません。")).toBeVisible();
    await expect(
      canvas.queryByRole("link", { name: "すべての項目を見る・検索する" })
    ).not.toBeInTheDocument();
  },
};
