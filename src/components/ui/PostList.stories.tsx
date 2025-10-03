import type { Meta, StoryObj } from "@storybook/react";
import { PostList } from "./PostList";
import { parseISO } from "date-fns";

export default {
  title: "Components/Ui/PostList",
  component: PostList,
} satisfies Meta<typeof PostList>;

type Story = StoryObj<typeof PostList>;

const mockPosts = [
  {
    _path: "sample-post-1",
    title: "サンプル記事 1",
    date: parseISO("2025-06-01"),
    category: "blog",
    tags: ["Next.js"],
    parent: true,
  },
  {
    _path: "sample-post-2",
    title: "サンプル記事 2",
    date: parseISO("2025-05-15"),
    category: "blog",
    tags: ["TypeScript"],
    parent: true,
  },
];

export const Default: Story = {
  args: {
    posts: mockPosts as any,
    basePath: "blog/post",
    title: "最新記事",
    variant: "list",
  },
};
