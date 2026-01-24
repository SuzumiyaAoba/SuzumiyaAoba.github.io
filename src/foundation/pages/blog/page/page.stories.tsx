import type { Meta, StoryObj } from "@storybook/react";
import { BlogPaginationPageContent, type BlogPaginationPageContentProps } from "./ui/page-content";

const meta = {
  title: "Pages/Blog/Pagination",
  component: BlogPaginationPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BlogPaginationPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummyPosts: BlogPaginationPageContentProps["posts"] = Array.from({ length: 10 }, (_, i) => ({
  slug: `post-${i + 1}`,
  ja: {
    slug: `post-${i + 1}`,
    content: "Content",
    format: "mdx",
    frontmatter: {
      title: `Sample Post ${i + 1}`,
      date: "2024-01-01",
      tags: ["Tag1"],
      category: "Category",
    },
  },
  en: null,
}));

export const Japanese: Story = {
  args: {
    locale: "ja",
    pageNumber: 1,
    pageCount: 5,
    posts: dummyPosts,
  },
};

export const English: Story = {
  args: {
    locale: "en",
    pageNumber: 2,
    pageCount: 5,
    posts: dummyPosts,
  },
};
