import type { Meta, StoryObj } from "@storybook/react";
import { PostList } from "./PostList";

export default {
  title: "Components/Ui/PostList",
  component: PostList,
} satisfies Meta<typeof PostList>;

type Story = StoryObj<typeof PostList>;

export const Default: Story = {
  args: {},
};
