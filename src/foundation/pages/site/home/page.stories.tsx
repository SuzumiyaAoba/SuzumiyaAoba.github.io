import type { Meta, StoryObj } from "@storybook/react";

import { HomePageContent } from "./ui/page";

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

const dummyActivityPosts = [
  {
    slug: "post-1",
    title: "Sample Post 1",
    date: "2024-01-01",
    tags: ["Tag1"],
  },
  {
    slug: "post-2",
    title: "Sample Post 2",
    date: "2024-01-02",
    tags: ["Tag2"],
  },
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
    activityPosts: dummyActivityPosts,
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
  },
};
