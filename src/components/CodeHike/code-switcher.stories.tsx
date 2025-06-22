import type { Meta, StoryObj } from "@storybook/react";
import { code-switcher } from "./code-switcher";

export default {
  title: "Components/code-switcher",
  component: code-switcher,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof code-switcher>;

type Story = StoryObj<typeof code-switcher>;

export const Default: Story = {
  args: {},
};
