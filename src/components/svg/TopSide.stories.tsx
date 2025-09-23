import type { Meta, StoryObj } from "@storybook/nextjs";
import { TopSide } from "./TopSide";

export default {
  title: "Components/Svg/TopSide",
  component: TopSide,
} satisfies Meta<typeof TopSide>;

type Story = StoryObj<typeof TopSide>;

export const Default: Story = {
  args: {},
};
