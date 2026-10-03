import type { Meta, StoryObj } from "@storybook/react";
import { TagDetailPageContent } from "./ui/page-content";
import type { TagDetailPageContentProps } from "./ui/page-content";

const meta = {
  title: "Pages/Tags/Detail",
  component: TagDetailPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TagDetailPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummyEntries: TagDetailPageContentProps["entries"] = [
  {
    slug: "post-1",
    title: "Post with Tag",
    date: "2024-01-01",
    tags: ["OtherTag"],
    category: "Category A",
    description: "タグの付いた記事の要約。一覧では 2 行まで表示する。",
  },
  {
    slug: "post-2",
    title: "Another Post",
    date: "2024-01-02",
    tags: ["TagB"],
    category: undefined,
  },
];

export const Japanese: Story = {
  args: {
    locale: "ja",
    tag: "React",
    entries: dummyEntries,
  },
};

export const English: Story = {
  args: {
    locale: "en",
    tag: "React",
    entries: dummyEntries,
  },
};

export const Empty: Story = {
  args: {
    locale: "ja",
    tag: "EmptyTag",
    entries: [],
  },
};
