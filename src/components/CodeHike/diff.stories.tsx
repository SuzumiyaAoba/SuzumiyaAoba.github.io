import type { Meta, StoryObj } from "@storybook/react";
import { diff } from "./diff";

export default {
  title: "Components/diff",
  component: diff,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof diff>;

type Story = StoryObj<typeof diff>;

export const Default: Story = {
  args: {},
};
