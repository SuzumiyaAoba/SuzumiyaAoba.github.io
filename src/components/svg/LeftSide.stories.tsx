import type { Meta, StoryObj } from "@storybook/react";
import { LeftSide } from "./LeftSide";

export default {
  title: "Components/LeftSide",
  component: LeftSide,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LeftSide>;

type Story = StoryObj<typeof LeftSide>;

export const Default: Story = {
  args: {},
};
