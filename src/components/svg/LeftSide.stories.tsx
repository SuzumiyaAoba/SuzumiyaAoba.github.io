import type { Meta, StoryObj } from "@storybook/react";
import { LeftSide } from "./LeftSide";

export default {
  title: "Components/Svg/LeftSide",
  component: LeftSide,
} satisfies Meta<typeof LeftSide>;

type Story = StoryObj<typeof LeftSide>;

export const Default: Story = {
  args: {},
};
