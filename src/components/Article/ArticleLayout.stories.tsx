import type { Meta, StoryObj } from "@storybook/react";
import { ArticleLayout } from "./ArticleLayout";

export default {
  title: "Components/Article/ArticleLayout",
  component: ArticleLayout,
} satisfies Meta<typeof ArticleLayout>;

type Story = StoryObj<typeof ArticleLayout>;

export const Default: Story = {
  args: {},
};
