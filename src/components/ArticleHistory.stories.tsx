import type { Meta, StoryObj } from "@storybook/react";
import { ArticleHistory } from "./ArticleHistory";

export default {
  title: "Components/ArticleHistory",
  component: ArticleHistory,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ArticleHistory>;

type Story = StoryObj<typeof ArticleHistory>;

export const Default: Story = {
  args: {},
};
