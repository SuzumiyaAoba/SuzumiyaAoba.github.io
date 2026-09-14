import type { Meta, StoryObj } from "@storybook/react";

import { HomePageContent } from "./ui/page";
import type { HomePageContentProps } from "./ui/page";

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
};

export const English: Story = {
  args: {
    locale: "en",
    series: series.map((item, index) => ({
      ...item,
      name: ["Design patterns", "Local AI agents", "Scala", "Nix"][index] ?? item.name,
    })),
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
};
