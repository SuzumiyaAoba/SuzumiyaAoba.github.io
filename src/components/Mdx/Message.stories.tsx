import type { Meta, StoryObj } from "@storybook/nextjs";

import { Message } from "./Message";

export default {
  title: "Components/Mdx/Message",
  component: Message,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["info", "success", "warning", "error"],
    },
  },
} satisfies Meta<typeof Message>;

type Story = StoryObj<typeof Message>;

export const Default: Story = {
  args: {
    title: "情報メッセージ",
    children: (
      <p>
        これは情報メッセージの例です。ユーザーに情報を伝えるために使用します。
      </p>
    ),
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    title: "成功メッセージ",
    children: (
      <p>
        操作が正常に完了しました。成功メッセージはユーザーに正常な処理結果を伝えるために使用します。
      </p>
    ),
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "警告メッセージ",
    children: (
      <p>
        注意が必要な操作です。警告メッセージはユーザーに注意を促すために使用します。
      </p>
    ),
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "エラーメッセージ",
    children: (
      <p>
        エラーが発生しました。エラーメッセージはユーザーに問題が起きたことを伝えるために使用します。
      </p>
    ),
  },
};

export const WithoutIcon: Story = {
  args: {
    title: "アイコンなしメッセージ",
    showIcon: false,
    children: (
      <p>
        これはアイコンなしのメッセージです。シンプルな見た目が必要な場合に使用します。
      </p>
    ),
  },
};

export const WithMarkdown: Story = {
  args: {
    variant: "info",
    title: "マークダウンを含むメッセージ",
    children: (
      <>
        <p>マークダウン形式のコンテンツを含めることができます：</p>
        <ul>
          <li>リスト項目1</li>
          <li>リスト項目2</li>
          <li>リスト項目3</li>
        </ul>
        <p>
          <strong>太字</strong>や<em>斜体</em>もサポートされています。
        </p>
        <pre>
          <code>console.log(&apos;コードブロックもサポート&apos;);</code>
        </pre>
      </>
    ),
  },
};

export const WithoutTitle: Story = {
  args: {
    children: (
      <p>
        タイトルなしのメッセージも表示できます。シンプルな通知に適しています。
      </p>
    ),
  },
};

export const DarkTheme: Story = {
  args: {
    title: "ダークモードのメッセージ",
    children: (
      <p>
        これはダークモードで表示されるメッセージの例です。テーマに応じて色が変わります。
      </p>
    ),
  },
};

export const DarkThemeSuccess: Story = {
  args: {
    variant: "success",
    title: "ダークモードの成功メッセージ",
    children: <p>ダークモードでの成功メッセージの表示例です。</p>,
  },
};

export const DarkThemeWarning: Story = {
  args: {
    variant: "warning",
    title: "ダークモードの警告メッセージ",
    children: <p>ダークモードでの警告メッセージの表示例です。</p>,
  },
};

export const DarkThemeError: Story = {
  args: {
    variant: "error",
    title: "ダークモードのエラーメッセージ",
    children: <p>ダークモードでのエラーメッセージの表示例です。</p>,
  },
};
