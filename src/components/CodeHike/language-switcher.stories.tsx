import type { Meta, StoryObj } from "@storybook/react";
import { language-switcher } from "./language-switcher";

export default {
  title: "Components/language-switcher",
  component: language-switcher,
} satisfies Meta<typeof language-switcher>;

type Story = StoryObj<typeof language-switcher>;

export const Default: Story = {
  args: {},
};
