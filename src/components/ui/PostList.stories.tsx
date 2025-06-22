import type { Meta, StoryObj } from "@storybook/react";
import { PostList } from "./PostList";

export default {
  title: "Components/PostList",
  component: PostList,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof PostList>;

type Story = StoryObj<typeof PostList>;

export const Default: Story = {
  args: {},
};
