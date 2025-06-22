import type { Meta, StoryObj } from "@storybook/react";
import { Bits } from "./Bits";

export default {
  title: "Components/Svg/Bits",
  component: Bits,
} satisfies Meta<typeof Bits>;

type Story = StoryObj<typeof Bits>;

export const Default: Story = {
  args: {},
};
