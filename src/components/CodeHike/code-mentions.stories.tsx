import type { Meta, StoryObj } from "@storybook/react";
import { code-mentions } from "./code-mentions";

export default {
  title: "Components/code-mentions",
  component: code-mentions,
} satisfies Meta<typeof code-mentions>;

type Story = StoryObj<typeof code-mentions>;

export const Default: Story = {
  args: {},
};
