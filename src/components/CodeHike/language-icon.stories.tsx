import type { Meta, StoryObj } from "@storybook/react";
import { language-icon } from "./language-icon";

export default {
  title: "Components/language-icon",
  component: language-icon,
} satisfies Meta<typeof language-icon>;

type Story = StoryObj<typeof language-icon>;

export const Default: Story = {
  args: {},
};
