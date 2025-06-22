import type { Meta, StoryObj } from "@storybook/react";
import { code-with-tooltips } from "./code-with-tooltips";

export default {
  title: "Components/code-with-tooltips",
  component: code-with-tooltips,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof code-with-tooltips>;

type Story = StoryObj<typeof code-with-tooltips>;

export const Default: Story = {
  args: {},
};
