import type { Meta, StoryObj } from "@storybook/react";
import { ThemeTest } from "./ThemeTest";

export default {
  title: "Components/ThemeTest",
  component: ThemeTest,
} satisfies Meta<typeof ThemeTest>;

type Story = StoryObj<typeof ThemeTest>;

export const Default: Story = {
  args: {},
};
