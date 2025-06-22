import type { Meta, StoryObj } from "@storybook/react";
import { tabs } from "./tabs";

export default {
  title: "Components/tabs",
  component: tabs,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof tabs>;

type Story = StoryObj<typeof tabs>;

export const Default: Story = {
  args: {},
};
