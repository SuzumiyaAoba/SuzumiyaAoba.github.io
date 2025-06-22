import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./index";

export default {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggle>;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  args: {},
};
