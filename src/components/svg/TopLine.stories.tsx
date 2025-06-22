import type { Meta, StoryObj } from "@storybook/react";
import { TopLine } from "./TopLine";

export default {
  title: "Components/TopLine",
  component: TopLine,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TopLine>;

type Story = StoryObj<typeof TopLine>;

export const Default: Story = {
  args: {},
};
