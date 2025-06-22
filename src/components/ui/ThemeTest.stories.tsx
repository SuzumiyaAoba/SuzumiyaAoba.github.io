import type { Meta, StoryObj } from "@storybook/react";
import { ThemeTest } from "./ThemeTest";

export default {
  title: "Components/ThemeTest",
  component: ThemeTest,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeTest>;

type Story = StoryObj<typeof ThemeTest>;

export const Default: Story = {
  args: {},
};
