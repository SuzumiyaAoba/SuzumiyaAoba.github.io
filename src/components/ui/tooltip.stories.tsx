import type { Meta, StoryObj } from "@storybook/react";
import { tooltip } from "./tooltip";

export default {
  title: "Components/tooltip",
  component: tooltip,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof tooltip>;

type Story = StoryObj<typeof tooltip>;

export const Default: Story = {
  args: {},
};
