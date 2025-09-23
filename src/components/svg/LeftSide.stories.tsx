import type { Meta, StoryObj } from "@storybook/nextjs";
import { LeftSide } from "./LeftSide";

export default {
  title: "Components/Svg/LeftSide",
  component: LeftSide,
} satisfies Meta<typeof LeftSide>;

type Story = StoryObj<typeof LeftSide>;

export const Default: Story = {
  args: {},
};
