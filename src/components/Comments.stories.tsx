import type { Meta, StoryObj } from "@storybook/react";

import { Comments } from "./Comments";

export default {
  title: "Components/Comments",
  component: Comments,
} satisfies Meta<typeof Comments>;

type Story = StoryObj<typeof Comments>;

export const Default: Story = {
  args: {},
};
