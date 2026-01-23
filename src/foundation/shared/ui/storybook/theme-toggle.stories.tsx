import type { Meta, StoryObj } from "@storybook/react";

import { ThemeToggle } from "@/shared/ui/theme-toggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "shared/ThemeToggle",
  component: ThemeToggle,
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
