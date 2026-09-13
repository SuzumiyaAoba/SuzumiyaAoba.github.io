import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import type { AwesomeItem } from "./model/awesome-item";
import { AwesomeSomethingPageContent } from "./ui/page-content";

const items: AwesomeItem[] = [
  {
    id: "example-library",
    name: "Example Library",
    category: "ライブラリ",
    description: "データの検証を扱うライブラリ。\n型の推論にも対応しています。",
    websiteUrl: "https://example.com/library/",
    githubUrl: "https://github.com/example/library",
    articles: [
      { url: "https://example.com/library/introduction" },
      { title: "使い方を学ぶ", url: "https://example.com/library/guide" },
    ],
    relatedPosts: [{ title: "試してみた記録", url: "/blog/post/example-library/" }],
  },
  {
    id: "example-service",
    name: "Example Service",
    category: "サービス",
    description: "日々の発見やアイデアをまとめるサービス。",
    websiteUrl: "https://example.com/service/",
    articles: [],
    relatedPosts: [],
  },
  {
    id: "example-framework",
    name: "Example Framework",
    category: "フレームワーク",
    description: "Web アプリケーションを構築するためのフレームワーク。",
    githubUrl: "https://github.com/example/framework",
    articles: [],
    relatedPosts: [],
  },
  {
    id: "example-app",
    name: "Example App",
    category: "アプリケーション",
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
    const library = within(canvas.getByRole("article", { name: "Example Library" }));
    await expect(library.getByRole("link", { name: "公式サイト" })).toHaveAttribute(
      "href",
      "https://example.com/library/",
    );
    await expect(library.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/example/library",
    );
    await expect(library.getByRole("link", { name: "使い方を学ぶ" })).toHaveAttribute(
      "target",
      "_blank",
    );
    await expect(library.getByRole("link", { name: "試してみた記録" })).toHaveAttribute(
      "href",
      "/blog/post/example-library/",
    );
    const app = within(canvas.getByRole("article", { name: "Example App" }));
    await expect(app.queryAllByRole("link")).toHaveLength(0);
    await expect(app.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  },
};

export const English: Story = {
  args: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("4 of 4 items");
    await expect(canvas.getByRole("link", { name: "試してみた記録" })).toHaveAttribute(
      "href",
      "/blog/post/example-library/",
    );
  },
};

export const Filtering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox");

    await userEvent.click(canvas.getByRole("button", { name: "ライブラリ" }));
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent("4 件中 1 件を表示");

    await userEvent.type(search, "service");
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
    await expect(canvas.getByText("条件に一致する項目がありません。")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "絞り込みを解除" }));
    await expect(search).toHaveValue("");
    await expect(canvas.getByRole("button", { name: "すべて" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(4);

    await userEvent.type(search, "  ＥＸＡＭＰＬＥ  検証  ");
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(canvas.getByRole("article", { name: "Example Library" })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("まだ登録がありません。")).toBeVisible();
    await expect(canvas.queryByRole("searchbox")).not.toBeInTheDocument();
  },
};

export const LongContent: Story = {
  args: {
    items: [
      {
        ...items[0]!,
        name: "A library with a long name for everyday development and experimentation",
        category: "開発・データ分析・ワークフローの自動化に関するツール",
        articles: [{ url: `https://example.com/articles/${"long-path-".repeat(20)}` }],
      },
      ...items.slice(1),
    ],
  },
};
