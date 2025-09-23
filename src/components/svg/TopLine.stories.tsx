import type { Meta, StoryObj } from "@storybook/nextjs";
import { TopLine } from "./TopLine";

export default {
  title: "Components/Svg/TopLine",
  component: TopLine,
} satisfies Meta<typeof TopLine>;

type Story = StoryObj<typeof TopLine>;

export const Default: Story = {
  args: {},
};
