import type { Meta, StoryObj } from "@storybook/react";

import { BlogPostPageContent } from "./ui/page-content";

const meta: Meta<typeof BlogPostPageContent> = {
  title: "pages/blog/BlogPost",
  component: BlogPostPageContent,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    locale: "ja",
    postTitle: "Sample Post Title",
    postDate: "2024-01-01",
    category: "Tech",
    tags: ["React", "Next.js"],
    postPath: "/blog/post/sample",
    shareUrl: "#",
    isEn: false,
    originalPath: "/blog/post/sample",
    content: (
      <div className="space-y-4">
        <p>This is a sample blog post content mocked for Storybook.</p>
        <h2>Heading 2</h2>
        <p>Some more text here.</p>
        <h3>Heading 3</h3>
        <p>Even more text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
      </div>
    ),
    amazonProducts: [],
    shouldShowAmazonAssociate: true,
    headings: [
      { id: "heading-2", text: "Heading 2", level: 2 },
      { id: "heading-3", text: "Heading 3", level: 3 },
    ],
    prev: {
      slug: "prev-post",
      title: "Previous Post Title",
    },
    next: {
      slug: "next-post",
      title: "Next Post Title",
    },
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof BlogPostPageContent>;

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
};

export const English: Story = {
  args: {
    locale: "en",
    postTitle: "Sample Post Title (EN)",
    isEn: true,
  },
};
