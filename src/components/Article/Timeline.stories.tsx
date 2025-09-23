import type { Meta, StoryObj } from "@storybook/nextjs";
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
    date: parseISO("2025-06-15"),
    tags: ["TypeScript"],
  },
  {
    _path: "sample-post-3",
    title: "Scala 再入門",
    date: parseISO("2025-06-20"),
    tags: ["Scala", "Cats"],
  },
] as any; // casting for storybook mock

const postsMultipleMonths = [
  // 2025年6月 (既存)
  ...samplePosts,
  // 2025年5月
  {
    _path: "may-post-1",
    title: "5月の記事 A",
    date: parseISO("2025-05-10"),
    tags: ["React"],
  },
  {
    _path: "may-post-2",
    title: "5月の記事 B",
    date: parseISO("2025-05-20"),
    tags: ["Next.js"],
  },
  // 2024年12月
  {
    _path: "dec-post-1",
    title: "12月の記事",
    date: parseISO("2024-12-25"),
    tags: ["YearEnd"],
  },
] as any;

export const Default: Story = {
  args: {
    posts: samplePosts,
  },
};

export const MultipleMonths: Story = {
  args: {
    posts: postsMultipleMonths,
  },
};
