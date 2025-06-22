import type { Meta, StoryObj } from "@storybook/react";
import { custom-code-block } from "./custom-code-block";

export default {
  title: "Components/custom-code-block",
  component: custom-code-block,
} satisfies Meta<typeof custom-code-block>;

type Story = StoryObj<typeof custom-code-block>;

export const Default: Story = {
  args: {},
};
