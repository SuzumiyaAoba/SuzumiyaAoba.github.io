import type { Meta, StoryObj } from "@storybook/react";
import { code-tabs } from "./code-tabs";

export default {
  title: "Components/code-tabs",
  component: code-tabs,
} satisfies Meta<typeof code-tabs>;

type Story = StoryObj<typeof code-tabs>;

export const Default: Story = {
  args: {},
};
