import type { Meta, StoryObj } from "@storybook/nextjs";
import { AsciiInfo } from "./AsciiInfo";

export default {
  title: "Components/Svg/AsciiInfo",
  component: AsciiInfo,
} satisfies Meta<typeof AsciiInfo>;

type Story = StoryObj<typeof AsciiInfo>;

export const Default: Story = {
  args: {},
};
