import type { Meta, StoryObj } from "@storybook/react";
import { mark } from "./mark";

export default {
  title: "Components/mark",
  component: mark,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof mark>;

type Story = StoryObj<typeof mark>;

export const Default: Story = {
  args: {},
};
