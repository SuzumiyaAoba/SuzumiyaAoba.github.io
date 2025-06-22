import type { Meta, StoryObj } from "@storybook/react";
import { code } from "./code";

export default {
  title: "Components/CodeHike/code",
  component: code,
} satisfies Meta<typeof code>;

type Story = StoryObj<typeof code>;

export const Default: Story = {
  args: {},
};
