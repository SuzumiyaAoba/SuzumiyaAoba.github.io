import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import type { AwesomeItem } from "./model/awesome-item";
import { resolveAwesomeSelection } from "./model/awesome-categories";
import { AwesomeCategoryPageContent } from "./ui/category-page-content";

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
  title: "Pages/AwesomeSomething/List",
  component: AwesomeCategoryPageContent,
  parameters: { layout: "fullscreen" },
  args: { locale: "ja", items, selection: {} },
} satisfies Meta<typeof AwesomeCategoryPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const library = within(
      canvas.getByRole("article", { name: "Example Library" })
    );
    const tags = within(library.getByRole("list", { name: "タグ" }));
    await expect(tags.getAllByRole("listitem")).toHaveLength(2);
    await expect(tags.getByText("TypeScript")).toBeVisible();
    await expect(tags.getByText("バリデーション")).toBeVisible();
    await expect(
      library.getByRole("link", { name: "公式サイト" })
    ).toHaveAttribute("href", "https://example.com/library/");
    await expect(library.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/example/library"
    );
    await expect(
      library.getByRole("link", { name: "使い方を学ぶ" })
    ).toHaveAttribute("target", "_blank");
    await expect(
      library.getByRole("link", { name: "試してみた記録" })
    ).toHaveAttribute("href", "/blog/post/example-library/");
    const app = within(canvas.getByRole("article", { name: "Example App" }));
    await expect(
      app.queryByRole("list", { name: "タグ" })
    ).not.toBeInTheDocument();
    await expect(app.queryAllByRole("link")).toHaveLength(0);
    await expect(app.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  },
};

export const English: Story = {
  args: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("4 of 4 items");
    const library = within(
      canvas.getByRole("article", { name: "Example Library" })
    );
    await expect(library.getByRole("list", { name: "Tags" })).toHaveTextContent(
      "TypeScript"
    );
    await expect(
      canvas.getByRole("link", { name: "試してみた記録" })
    ).toHaveAttribute("href", "/blog/post/example-library/");
    await userEvent.type(
      canvas.getByRole("searchbox", {
        name: "Search by name, description, category, or tag",
      }),
      "typescript"
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 4 items");
    await userEvent.click(library.getByRole("button", { name: "TypeScript" }));
    const clearTag = canvas.getByRole("button", {
      name: "Clear tag filter: TypeScript",
    });
    await expect(clearTag).toBeVisible();
    await userEvent.click(clearTag);
    await expect(canvas.getByRole("searchbox")).toHaveValue("typescript");
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 4 items");
  },
};

export const Filtering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox");

    await userEvent.click(
      canvas.getByRole("button", { name: "開発・プログラミング" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "4 件中 1 件を表示"
    );

    await userEvent.type(search, "service");
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
    await expect(
      canvas.getByText("条件に一致する項目がありません。")
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "絞り込みを解除" })
    );
    await expect(search).toHaveValue("");
    await expect(
      canvas.getByRole("button", { name: "すべて" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getAllByRole("article")).toHaveLength(4);

    await userEvent.type(search, "  ＥＸＡＭＰＬＥ  検証  ");
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(
      canvas.getByRole("article", { name: "Example Library" })
    ).toBeVisible();

    await userEvent.clear(search);
    await userEvent.type(search, "ｔｙｐｅｓｃｒｉｐｔ");
    await expect(canvas.getAllByRole("article")).toHaveLength(2);
    await userEvent.click(
      canvas.getByRole("button", { name: "AI・エージェント" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(
      canvas.getByRole("article", { name: "Example Framework" })
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "絞り込みを解除" })
    );
    await userEvent.type(search, "TypeScript バリデーション");
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(
      canvas.getByRole("article", { name: "Example Library" })
    ).toBeVisible();
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

export const TagFiltering: Story = {
  args: {
    items: items.map((item) =>
      item.id === "example-service"
        ? {
            ...item,
            tags: [...item.tags, "TypeScript入門"],
            description: "TypeScript のサービス。",
          }
        : item
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox");
    const libraryTag = () =>
      within(
        canvas.getByRole("article", { name: "Example Library" })
      ).getByRole("button", {
        name: "TypeScript",
      });

    await userEvent.click(libraryTag());
    await expect(canvas.getAllByRole("article")).toHaveLength(2);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "4 件中 2 件を表示"
    );
    for (const button of canvas.getAllByRole("button", {
      name: "TypeScript",
    })) {
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }

    await userEvent.click(
      canvas.getByRole("button", { name: "開発・プログラミング" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await userEvent.type(search, "service");
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
    await expect(
      canvas.getByText("条件に一致する項目がありません。")
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "タグ「TypeScript」の絞り込みを解除" })
    );
    await expect(search).toHaveValue("service");
    await expect(
      canvas.getByRole("button", { name: "開発・プログラミング" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);

    await userEvent.click(
      canvas.getByRole("button", { name: "絞り込みを解除" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(4);
    await userEvent.click(libraryTag());
    await userEvent.keyboard(" ");
    await expect(canvas.getAllByRole("article")).toHaveLength(4);
    await expect(libraryTag()).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(libraryTag());
    await userEvent.click(canvas.getByRole("button", { name: "Web開発" }));
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(
      canvas.getByRole("article", { name: "Example Framework" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Web開発" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.getByRole("button", { name: "TypeScript" })
    ).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(
      canvas.getByRole("button", { name: "絞り込みを解除" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(4);
    await expect(search).toHaveValue("");
    await expect(libraryTag()).toHaveAttribute("aria-pressed", "false");
  },
};

export const LongContent: Story = {
  args: {
    items: [
      {
        ...requireValue(items[0]),
        name: "A library with a long name for everyday development and experimentation",
        tags: [
          "TypeScript",
          "開発ワークフローの自動化とデータの検証",
          "long-tag-".repeat(15),
        ],
        articles: [
          { url: `https://example.com/articles/${"long-path-".repeat(20)}` },
        ],
      },
      ...items.slice(1),
    ],
  },
};

export const Subcategory: Story = {
  args: {
    selection: requireValue(
      resolveAwesomeSelection(["development", "libraries"])
    ),
    items: [
      ...items,
      {
        ...requireValue(items[0]),
        id: "example-agent",
        name: "Example Agent",
        subcategory: "coding-agents",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
    await expect(
      canvas.getByRole("article", { name: "Example Library" })
    ).toBeVisible();
    const navigation = within(
      canvas.getByRole("navigation", { name: "サブカテゴリ" })
    );
    await expect(
      navigation.getByRole("link", { name: "文書処理・汎用ライブラリ 1" })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      navigation.getByRole("link", { name: "AIコーディング 1" })
    ).toHaveAttribute("href", "/awesome-something/development/coding-agents/");
    await expect(
      navigation.getByRole("link", { name: "このカテゴリのすべて 2" })
    ).toHaveAttribute("href", "/awesome-something/development/");
    await userEvent.type(canvas.getByRole("searchbox"), "no-match");
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "絞り込みを解除" })
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(1);
  },
};

function requireValue<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("Required story fixture was not found");
  }
  return value;
}
