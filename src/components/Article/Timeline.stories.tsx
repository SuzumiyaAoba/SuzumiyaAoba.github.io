import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./Timeline";

export default {
  title: "Components/Timeline",
  component: Timeline,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Timeline>;

type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  args: {},
};
