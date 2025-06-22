import type { Meta, StoryObj } from "@storybook/react";
import { ArticleLayout } from "./ArticleLayout";

export default {
  title: "Components/ArticleLayout",
  component: ArticleLayout,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ArticleLayout>;

type Story = StoryObj<typeof ArticleLayout>;

export const Default: Story = {
  args: {},
};
