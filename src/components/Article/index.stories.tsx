import type { Meta, StoryObj } from "@storybook/react";

import { Article } from "./index";

// サンプル記事本文
const sampleContent = (
  <div className="space-y-4">
    <p>
      これは Storybook 上で Article
      コンポーネントをプレビューするためのサンプル本文です。
    </p>
    <h2>セクション 1</h2>
    <p>
      Next.js と Tailwind CSS
      を用いて開発されたブログ記事の本文を想定しています。
    </p>
    <h3>小見出し</h3>
    <p>
      Storybook では実際の Markdown レンダリング結果ではなく、プレーンな JSX を
      配置しています。
    </p>
    <ul className="list-disc ml-6 space-y-1">
      <li>ポイント 1</li>
      <li>ポイント 2</li>
      <li>ポイント 3</li>
    </ul>
    <p>最後にまとめを書きます。</p>
  </div>
);

export default {
  title: "Components/Article/Article",
  component: Article,
  argTypes: {
    showComments: {
      control: { type: "boolean" },
    },
    showBuyMeACoffee: {
      control: { type: "boolean" },
    },
    showShareButtons: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof Article>;

type Story = StoryObj<typeof Article>;

export const Default: Story = {
  args: {
    title: "Storybook で表示するサンプル記事",
    date: new Date(),
    tags: ["Storybook", "Next.js", "ブログ"],
    children: sampleContent,
    showComments: false,
    showBuyMeACoffee: false,
  },
};
