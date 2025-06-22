import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./Timeline";
import { parseISO } from "date-fns";

export default {
  title: "Components/Article/Timeline",
  component: Timeline,
} satisfies Meta<typeof Timeline>;

type Story = StoryObj<typeof Timeline>;

const samplePosts = [
  {
    _path: "sample-post-1",
    title: "初めてのブログ",
    date: parseISO("2025-06-01"),
    tags: ["Next.js", "Storybook"],
  },
  {
    _path: "sample-post-2",
    title: "技術記事を書く",
    date: parseISO("2025-05-15"),
    tags: ["TypeScript"],
  },
  {
    _path: "sample-post-3",
    title: "Scala 再入門",
    date: parseISO("2024-12-19"),
    tags: ["Scala", "Cats"],
  },
] as any; // casting for storybook mock

export const Default: Story = {
  args: {
    posts: samplePosts,
  },
};
