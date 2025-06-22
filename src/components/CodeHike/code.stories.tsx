import type { Meta, StoryObj } from "@storybook/react";
import { code } from "./code";

export default {
  title: "Components/code",
  component: code,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof code>;

type Story = StoryObj<typeof code>;

export const Default: Story = {
  args: {},
};
