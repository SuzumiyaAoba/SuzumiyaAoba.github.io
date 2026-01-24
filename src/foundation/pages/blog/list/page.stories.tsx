import type { Meta, StoryObj } from "@storybook/react";

import { BlogListPageContent } from "./ui/page-content";

const dummyPosts = [
  {
    slug: "post-1",
    ja: {
      slug: "post-1",
      content: "",
      format: "mdx" as const,
      frontmatter: {
        title: "Sample Post 1",
        date: "2024-01-01",
        tags: ["Tag1"],
      },
    },
    en: null,
  },
  {
    slug: "post-2",
    ja: {
      slug: "post-2",
      content: "",
      format: "mdx" as const,
      frontmatter: {
        title: "Sample Post 2",
        date: "2024-01-02",
        tags: ["Tag2"],
      },
    },
    en: null,
  },
];

const meta: Meta<typeof BlogListPageContent> = {
  title: "pages/blog/BlogList",
  component: BlogListPageContent,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    locale: "ja",
    posts: dummyPosts,
    totalCount: 25,
    currentPage: 1,
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof BlogListPageContent>;

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
};

export const English: Story = {
  args: {
    locale: "en",
  },
};
