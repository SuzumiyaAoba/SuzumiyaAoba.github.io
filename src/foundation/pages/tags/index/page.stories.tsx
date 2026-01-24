import type { Meta, StoryObj } from "@storybook/react";
import { TagsListPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Tags/Index",
  component: TagsListPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TagsListPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummyTags = [
  { name: "React", count: 10 },
  { name: "Next.js", count: 8 },
  { name: "TypeScript", count: 5 },
  { name: "Storybook", count: 3 },
  { name: "CSS", count: 2 },
  { name: "HTML", count: 1 },
];

export const Japanese: Story = {
  args: {
    locale: "ja",
    tags: dummyTags,
  },
};

export const English: Story = {
  args: {
    locale: "en",
    tags: dummyTags,
  },
};

export const Empty: Story = {
  args: {
    locale: "ja",
    tags: [],
  },
};
