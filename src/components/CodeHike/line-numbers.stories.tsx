import type { Meta, StoryObj } from "@storybook/react";
import { line-numbers } from "./line-numbers";

export default {
  title: "Components/line-numbers",
  component: line-numbers,
} satisfies Meta<typeof line-numbers>;

type Story = StoryObj<typeof line-numbers>;

export const Default: Story = {
  args: {},
};
