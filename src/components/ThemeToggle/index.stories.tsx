import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./index";

export default {
  title: "Components/ThemeToggle/ThemeToggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  args: {},
};
