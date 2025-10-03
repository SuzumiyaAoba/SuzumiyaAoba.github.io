import type { Meta, StoryObj } from "@storybook/react";
import Arrow from "./Arrow";

export default {
  title: "Components/Svg/Arrow",
  component: Arrow,
} satisfies Meta<typeof Arrow>;

type Story = StoryObj<typeof Arrow>;

export const Default: Story = {
  args: {
    startX: 10,
    startY: 10,
    endX: 150,
    endY: 100,
    strokeWidth: 2,
  },
};
