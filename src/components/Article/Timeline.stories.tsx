import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./Timeline";

export default {
  title: "Components/Article/Timeline",
  component: Timeline,
} satisfies Meta<typeof Timeline>;

type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  args: {},
};
