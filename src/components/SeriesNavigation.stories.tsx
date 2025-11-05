import type { Meta, StoryObj } from "@storybook/react";
import { SeriesNavigation } from "./SeriesNavigation";

export default {
  title: "Components/SeriesNavigation",
  component: SeriesNavigation,
} satisfies Meta<typeof SeriesNavigation>;

type Story = StoryObj<typeof SeriesNavigation>;

export const Default: Story = {
  args: {
    seriesName: "Scala Cats 型クラス",
    seriesSlug: "scala-cats-typeclass",
    currentIndex: 1,
    totalPosts: 3,
    previous: {
      slug: "2024-12-19-scala-cats",
      frontmatter: {
        title: "Scala Cats の基礎",
        date: new Date("2024-12-19"),
        category: "Scala",
        tags: ["Scala", "Cats"],
      },
      path: "2024-12-19-scala-cats",
    },
    next: {
      slug: "2024-12-21-scala-cats-order",
      frontmatter: {
        title: "Scala Cats の Order 型クラス",
        date: new Date("2024-12-21"),
        category: "Scala",
        tags: ["Scala", "Cats"],
      },
      path: "2024-12-21-scala-cats-order",
    },
  },
};

export const FirstArticle: Story = {
  args: {
    seriesName: "ローカル AI エージェントは電気羊の夢を見るのか",
    seriesSlug: "local-ai-agent",
    currentIndex: 0,
    totalPosts: 4,
    previous: null,
    next: {
      slug: "2025-10-20-local-ai-agent",
      frontmatter: {
        title: "ローカル AI エージェント入門（第2回）",
        date: new Date("2025-10-20"),
        category: "AI",
        tags: ["AI", "Agent"],
      },
      path: "2025-10-20-local-ai-agent",
    },
  },
};

export const LastArticle: Story = {
  args: {
    seriesName: "読書メモ",
    seriesSlug: "reading-notes",
    currentIndex: 1,
    totalPosts: 2,
    previous: {
      slug: "2025-05-17-prompt-enginnering-for-llms",
      frontmatter: {
        title: "Prompt Engineering for LLMs",
        date: new Date("2025-05-17"),
        category: "読書",
        tags: ["読書", "AI"],
      },
      path: "2025-05-17-prompt-enginnering-for-llms",
    },
    next: null,
  },
};
