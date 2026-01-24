import type { Meta, StoryObj } from "@storybook/react";
import { PostsIndexPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Posts/Index",
  component: PostsIndexPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PostsIndexPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  args: {
    locale: "ja",
    slugs: ["test-post-1", "test-post-2", "test-post-3"],
  },
};

export const English: Story = {
  args: {
    locale: "en",
    slugs: ["test-post-1", "test-post-2", "test-post-3"],
  },
};
